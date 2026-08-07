export interface Vector2D {
  x: number
  y: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  spin: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
  type: "sparkle" | "heart" | "confetti" | "star"
}

export class StickerParticleSystem {
  private particles: Particle[] = []
  private maxParticles: number

  constructor(maxParticles = 60) {
    this.maxParticles = maxParticles
  }

  public setMaxParticles(max: number) {
    this.maxParticles = max
  }

  public spawn(
    x: number,
    y: number,
    type: "sparkle" | "heart" | "confetti" | "star",
    count = 3,
  ) {
    if (this.particles.length >= this.maxParticles) return

    const colors = ["#fcd34d", "#f9a8d4", "#c4b5fd", "#93c5fd", "#ffffff"]

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 8,
        size: 5 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.8,
        type,
      })
    }
  }

  public update(deltaTime: number) {
    const gravity = 2.5

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life += deltaTime
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1)
        continue
      }

      p.x += p.vx * deltaTime * 60
      p.y += p.vy * deltaTime * 60
      p.vy += gravity * deltaTime
      p.rotation += p.spin
      p.alpha = Math.max(0, 1 - p.life / p.maxLife)
    }
  }

  public draw(context: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      context.save()
      context.translate(p.x, p.y)
      context.rotate((p.rotation * Math.PI) / 180)
      context.globalAlpha = p.alpha
      context.fillStyle = p.color

      if (p.type === "sparkle" || p.type === "star") {
        context.font = `${Math.round(p.size * 1.5)}px sans-serif`
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText("✦", 0, 0)
      } else if (p.type === "heart") {
        context.font = `${Math.round(p.size * 1.5)}px sans-serif`
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText("💖", 0, 0)
      } else {
        context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4)
      }

      context.restore()
    }
  }

  public clear() {
    this.particles = []
  }
}

export function lerp(start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end
}

export function springInterpolate(
  current: number,
  target: number,
  velocity: number,
  stiffness = 180,
  damping = 12,
  deltaTime = 0.016,
): { value: number; velocity: number } {
  const force = (target - current) * stiffness
  const dForce = velocity * damping
  const accel = force - dForce
  const newVelocity = velocity + accel * deltaTime
  const newValue = current + newVelocity * deltaTime

  return { value: newValue, velocity: newVelocity }
}
