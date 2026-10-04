import './style.css'
import * as THREE from 'three'

const canvas = document.querySelector('canvas.webgl')
const container = document.querySelector('#canvasContainer')
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const loader = new THREE.TextureLoader()
const height = loader.load('/height.png')
const texture = loader.load('/texture.jpg')
const alpha = loader.load('/alpha.png')

texture.encoding = THREE.sRGBEncoding

const scene = new THREE.Scene()

const geometry = new THREE.PlaneBufferGeometry(5.6, 5.6, 128, 128)
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: texture,
  displacementMap: height,
  displacementScale: 0.65,
  alphaMap: alpha,
  transparent: true,
  roughness: 0.78,
  metalness: 0.04,
  side: THREE.DoubleSide,
})

const plane = new THREE.Mesh(geometry, material)
plane.rotation.x = -1.02
plane.rotation.z = 0.35
plane.position.set(1.25, -0.25, 0)
scene.add(plane)

scene.add(new THREE.AmbientLight(0x5167a8, 0.7))

const blueLight = new THREE.PointLight(0x1847ff, 2.6, 18)
blueLight.position.set(2.2, 4.5, 3.5)
scene.add(blueLight)

const orangeLight = new THREE.PointLight(0xff991c, 1.5, 14)
orangeLight.position.set(-3.2, -0.5, 2)
scene.add(orangeLight)

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 40)
camera.position.set(0, 0.15, 5.4)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setClearColor(0x05070b, 1)

const pointer = { x: 0, y: 0 }

window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = (event.clientY / window.innerHeight) * 2 - 1
}, { passive: true })

document.querySelector('[data-reset-view]')?.addEventListener('click', () => {
  pointer.x = 0
  pointer.y = 0
})

function resize() {
  const width = Math.max(container.clientWidth, 1)
  const heightValue = Math.max(container.clientHeight, 1)

  camera.aspect = width / heightValue
  camera.updateProjectionMatrix()

  renderer.setSize(width, heightValue, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

window.addEventListener('resize', resize)
resize()

const clock = new THREE.Clock()

function tick() {
  const elapsed = clock.getElapsedTime()

  const targetDisplacement = 0.58 + (pointer.y + 1) * 0.14
  material.displacementScale += (targetDisplacement - material.displacementScale) * 0.05

  plane.rotation.z += ((0.35 + pointer.x * 0.16) - plane.rotation.z) * 0.04
  plane.rotation.x += ((-1.02 - pointer.y * 0.08) - plane.rotation.x) * 0.04

  if (!prefersReducedMotion) {
    plane.rotation.z += Math.sin(elapsed * 0.35) * 0.0005
  }

  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

tick()
