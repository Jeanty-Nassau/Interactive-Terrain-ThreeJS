import './style.css'
import * as THREE from 'three'

const canvas = document.querySelector('canvas.webgl')
const container = document.querySelector('#canvasContainer')
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x05070b)

const vertexShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uClickCenter;
  uniform float uClickAge;

  varying vec2 vUv;
  varying float vHeight;
  varying float vPulse;
  varying float vSweep;
  varying float vClickPulse;

  void main() {
    vec3 p = position;
    vUv = uv;

    vec2 pointerUv = vec2(0.5) + uPointer * 0.22;
    float radial = distance(uv, pointerUv);
    float clickRadial = distance(uv, uClickCenter);

    float waveA = sin((p.x * 1.75) + uTime * 0.95) * 0.2;
    float waveB = cos((p.y * 2.4) - uTime * 0.78) * 0.15;
    float diagonal = sin((p.x + p.y) * 1.9 - uTime * 1.15) * 0.11;

    float pointerRipple =
      sin(radial * 34.0 - uTime * 3.3) *
      exp(-radial * 5.4) *
      0.24;

    float clickRadius = max(uClickAge, 0.0) * 0.34;

    float clickRing =
      exp(-pow((clickRadial - clickRadius) * 32.0, 2.0)) *
      exp(-max(uClickAge, 0.0) * 0.85);

    float clickWave =
      sin(clickRadial * 46.0 - uClickAge * 8.0) *
      clickRing *
      0.6;

    float sweepPhase = fract(uTime * 0.115);
    float sweepDistance = abs(uv.y - sweepPhase);
    float sweep = exp(-sweepDistance * 32.0);

    p.z += waveA + waveB + diagonal + pointerRipple + clickWave + sweep * 0.12;

    vHeight = p.z;
    vPulse = exp(-radial * 6.0);
    vSweep = sweep;
    vClickPulse = clickRing;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;

  varying vec2 vUv;
  varying float vHeight;
  varying float vPulse;
  varying float vSweep;
  varying float vClickPulse;

  void main() {
    vec3 deep = vec3(0.008, 0.016, 0.055);
    vec3 cobalt = vec3(0.025, 0.12, 0.68);
    vec3 electric = vec3(0.16, 0.42, 1.0);

    float heightMix = smoothstep(-0.55, 0.6, vHeight);
    vec3 color = mix(deep, cobalt, heightMix);
    color = mix(color, electric, smoothstep(0.12, 0.7, vHeight));

    float contourPhase = fract((vHeight + 0.65) * 8.5);
    float contour =
      1.0 -
      smoothstep(0.455, 0.5, abs(contourPhase - 0.5));

    color += vec3(0.5, 0.66, 1.0) * contour * 0.2;

    float gridX =
      1.0 -
      smoothstep(0.47, 0.5, abs(fract(vUv.x * 18.0) - 0.5));

    float gridY =
      1.0 -
      smoothstep(0.47, 0.5, abs(fract(vUv.y * 12.0) - 0.5));

    color += vec3(0.12, 0.25, 0.72) * max(gridX, gridY) * 0.12;

    color += vec3(1.0, 0.28, 0.02) * smoothstep(0.22, 0.72, vHeight) * 0.48;
    color += vec3(1.0, 0.42, 0.04) * vPulse * 0.72;
    color += vec3(1.0, 0.5, 0.08) * vSweep * 0.9;
    color += vec3(1.0, 0.78, 0.25) * vClickPulse * 1.65;

    float edgeFade =
      smoothstep(
        0.02,
        0.16,
        min(
          min(vUv.x, 1.0 - vUv.x),
          min(vUv.y, 1.0 - vUv.y)
        )
      );

    float flicker =
      0.96 +
      sin(uTime * 7.0 + vUv.x * 20.0) * 0.02;

    gl_FragColor = vec4(color * flicker, edgeFade);
  }
`

const wireFragmentShader = `
  varying float vPulse;
  varying float vSweep;
  varying float vClickPulse;

  void main() {
    vec3 base = vec3(0.3, 0.5, 1.0);
    vec3 pulse =
      vec3(1.0, 0.45, 0.05) *
      (vPulse * 0.62 + vSweep * 0.5 + vClickPulse * 1.45);

    gl_FragColor = vec4(base + pulse, 0.16);
  }
`

const uniforms = {
  uTime: { value: 0 },
  uPointer: { value: new THREE.Vector2() },
  uClickCenter: { value: new THREE.Vector2(0.5, 0.5) },
  uClickAge: { value: 100 },
}

const surfaceGeometry = new THREE.PlaneBufferGeometry(8.1, 8.1, 190, 190)
const wireGeometry = new THREE.PlaneBufferGeometry(8.1, 8.1, 90, 90)

const surface = new THREE.Mesh(
  surfaceGeometry,
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
  })
)

const wire = new THREE.Mesh(
  wireGeometry,
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: wireFragmentShader,
    uniforms,
    transparent: true,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
)

wire.position.z = 0.028

const field = new THREE.Group()
field.add(surface, wire)
field.rotation.x = -0.84
field.position.set(0.85, -0.5, 0)
scene.add(field)

const signalNodes = [
  [-2.2, 1.45, 0.22],
  [1.7, 1.0, 0.18],
  [2.15, -1.25, 0.26],
  [-1.35, -1.55, 0.2],
]

signalNodes.forEach((position, index) => {
  const group = new THREE.Group()
  group.position.set(...position)

  const point = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 18, 18),
    new THREE.MeshBasicMaterial({
      color: index % 2 === 0 ? 0xff991c : 0x91a7ff,
    })
  )

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.11, 0.125, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff991c,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
  )

  ring.rotation.x = Math.PI / 2
  group.add(point, ring)
  field.add(group)
})

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60)
camera.position.set(0, 0, 6.5)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
})
renderer.setClearColor(0x05070b, 1)

const pointer = new THREE.Vector2()
const pulseCenter = new THREE.Vector2(0.5, 0.5)
let pulseStartedAt = -100

window.addEventListener(
  'pointermove',
  (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1
  },
  { passive: true }
)

canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect()

  pulseCenter.set(
    (event.clientX - rect.left) / rect.width,
    1 - (event.clientY - rect.top) / rect.height
  )

  pulseStartedAt = performance.now() / 1000
})

document.querySelector('[data-reset-field]')?.addEventListener('click', () => {
  pointer.set(0, 0)
  pulseCenter.set(0.5, 0.5)
  pulseStartedAt = performance.now() / 1000
})

function resize() {
  const width = Math.max(container.clientWidth, 1)
  const height = Math.max(container.clientHeight, 1)

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

window.addEventListener('resize', resize)
resize()

const clock = new THREE.Clock()

function tick() {
  const elapsed = clock.getElapsedTime()
  const clickAge = Math.max(0, performance.now() / 1000 - pulseStartedAt)

  uniforms.uTime.value = elapsed
  uniforms.uPointer.value.copy(pointer)
  uniforms.uClickCenter.value.copy(pulseCenter)
  uniforms.uClickAge.value = clickAge

  field.rotation.z += (pointer.x * 0.16 - field.rotation.z) * 0.04
  field.rotation.x += (-0.84 - pointer.y * 0.085 - field.rotation.x) * 0.04
  field.position.x += (0.85 + pointer.x * 0.22 - field.position.x) * 0.035
  field.position.y += (-0.5 - pointer.y * 0.2 - field.position.y) * 0.035

  if (prefersReducedMotion) {
    uniforms.uTime.value = 0.75
  }

  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

tick()
