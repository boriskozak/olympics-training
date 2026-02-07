;; =============================================
;; WASM PARTICLE PHYSICS ENGINE
;; Mountain Shred — GPU-Accelerated Snowboard Game
;; =============================================
;;
;; Memory layout: each particle = 32 bytes (8 x f32)
;;   offset  0: x        (f32)
;;   offset  4: y        (f32)
;;   offset  8: vx       (f32)
;;   offset 12: vy       (f32)
;;   offset 16: life     (f32)  — remaining life (seconds)
;;   offset 20: maxLife  (f32)  — initial life (for alpha calc)
;;   offset 24: size     (f32)  — radius in pixels
;;   offset 28: type     (f32)  — 0=snow, 1=trail, 2=burst, 3=sparkle, 4=hit
;;
;; Max particles: 10000
;; Memory needed: 10000 * 32 = 320,000 bytes (~5 pages)

(module
  (memory (export "memory") 8)  ;; 8 pages = 512KB

  (global $nextSlot (mut i32) (i32.const 0))
  (global $aliveCount (mut i32) (i32.const 0))

  ;; Byte offset for particle index: i * 32 = i << 5
  (func $off (param $i i32) (result i32)
    (i32.shl (local.get $i) (i32.const 5))
  )

  ;; ---- UPDATE ALL PARTICLES ----
  ;; Applies gravity, wind, friction; decays lifetime
  (func (export "updateParticles")
    (param $maxCount i32)
    (param $dt f32)
    (param $gravity f32)
    (param $windX f32)
    (local $i i32)
    (local $o i32)
    (local $life f32)
    (local $vx f32)
    (local $vy f32)
    (local $alive i32)
    (local $type f32)

    (local.set $alive (i32.const 0))
    (local.set $i (i32.const 0))

    (block $break
      (loop $loop
        (br_if $break (i32.ge_u (local.get $i) (local.get $maxCount)))

        (local.set $o (call $off (local.get $i)))
        (local.set $life (f32.load offset=16 (local.get $o)))

        (if (f32.gt (local.get $life) (f32.const 0))
          (then
            (local.set $vx (f32.load offset=8 (local.get $o)))
            (local.set $vy (f32.load offset=12 (local.get $o)))
            (local.set $type (f32.load offset=28 (local.get $o)))

            ;; Gravity
            (local.set $vy (f32.add (local.get $vy)
              (f32.mul (local.get $gravity) (local.get $dt))))

            ;; Wind (stronger for snow type 0)
            (local.set $vx (f32.add (local.get $vx)
              (f32.mul (local.get $windX) (local.get $dt))))

            ;; Position update
            (f32.store offset=0 (local.get $o)
              (f32.add (f32.load offset=0 (local.get $o))
                (f32.mul (local.get $vx) (local.get $dt))))
            (f32.store offset=4 (local.get $o)
              (f32.add (f32.load offset=4 (local.get $o))
                (f32.mul (local.get $vy) (local.get $dt))))

            ;; Friction (0.998 per tick)
            (local.set $vx (f32.mul (local.get $vx) (f32.const 0.998)))
            (local.set $vy (f32.mul (local.get $vy) (f32.const 0.998)))

            ;; Store velocity
            (f32.store offset=8 (local.get $o) (local.get $vx))
            (f32.store offset=12 (local.get $o) (local.get $vy))

            ;; Decay life
            (f32.store offset=16 (local.get $o)
              (f32.sub (local.get $life) (local.get $dt)))

            (local.set $alive (i32.add (local.get $alive) (i32.const 1)))
          )
        )

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)
      )
    )

    (global.set $aliveCount (local.get $alive))
  )

  ;; ---- EMIT SINGLE PARTICLE ----
  (func (export "emitParticle")
    (param $x f32) (param $y f32)
    (param $vx f32) (param $vy f32)
    (param $life f32) (param $size f32) (param $type f32)
    (local $o i32)

    (local.set $o (call $off (global.get $nextSlot)))

    (f32.store offset=0  (local.get $o) (local.get $x))
    (f32.store offset=4  (local.get $o) (local.get $y))
    (f32.store offset=8  (local.get $o) (local.get $vx))
    (f32.store offset=12 (local.get $o) (local.get $vy))
    (f32.store offset=16 (local.get $o) (local.get $life))
    (f32.store offset=20 (local.get $o) (local.get $life))
    (f32.store offset=24 (local.get $o) (local.get $size))
    (f32.store offset=28 (local.get $o) (local.get $type))

    ;; Advance circular buffer (wrap at 10000)
    (global.set $nextSlot
      (i32.rem_u
        (i32.add (global.get $nextSlot) (i32.const 1))
        (i32.const 10000)))
  )

  ;; ---- QUERIES ----
  (func (export "getAliveCount") (result i32)
    (global.get $aliveCount)
  )

  (func (export "getMaxParticles") (result i32)
    (i32.const 10000)
  )

  ;; ---- CLEAR ALL ----
  (func (export "clearParticles")
    (local $i i32)
    (local.set $i (i32.const 0))
    (block $break
      (loop $loop
        (br_if $break (i32.ge_u (local.get $i) (i32.const 320000)))
        (i32.store (local.get $i) (i32.const 0))
        (local.set $i (i32.add (local.get $i) (i32.const 4)))
        (br $loop)
      )
    )
    (global.set $nextSlot (i32.const 0))
    (global.set $aliveCount (i32.const 0))
  )
)
