import * as dat from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import gsap from 'gsap';

const clock = new THREE.Clock();
let previousTime = 0;
const webglExperience = {
    mainController: null,
    fanController: null,
    headerText: null,
    animatedText: null,
    animatedText: null,
    canvas: null,
    scene: null,
    loaders: null,
    textures: null,
    camera: null,
    cameraShouldLookAt: 'aircraft',
    renderer: null,
    material: null,
    controls: null,
    sizes: null,
    getSizes() {
        if (this.sizes) return this.sizes;
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }
        this.sizes = sizes;
        return sizes
    },
    getCanvas() {
        if (this.canvas) return this.canvas
        const canvas = document.querySelector('canvas.webgl');
        this.canvas = canvas;
        return canvas
    },
    getScene() {
        if (this.scene) return this.scene
        const scene = new THREE.Scene();
        this.scene = scene;
        return scene;
    },
    getLoaders() {
        if (this.loaders) return this.loaders
        //Loading Manager
        const loadingManager = new THREE.LoadingManager(
            () => {
                const overlay = document.querySelector(`[data-name='overlay']`)
                const loadingBar = document.querySelector(`[data-name='loadingBar']`)
                const timeline = gsap.timeline();
                timeline
                    .to(loadingBar, { scaleX: 1, opacity: 0, duration: 1 })
                    .to(loadingBar, { opacity: 0, duration: 2 })
                    .to(overlay, { opacity: 0, duration: 1 }, '<')
                    .to([overlay], { display: 'none' })
            },
            (itemsUrl, itemsLoaded, itemsTotal) => {
                const loadingBar = document.querySelector(`[data-name='loadingBar']`)
                const loadingFigure = document.querySelector(`[data-name='loadingFigure']`)
                const ratio = itemsLoaded / itemsTotal
                loadingFigure.innerHTML = `${Math.round(ratio * 100)}%`
                gsap.to(loadingBar, { scaleX: ratio, duration: 2 })
            }
        )
        // Texture loader
        const textureLoader = new THREE.TextureLoader(loadingManager);
        const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

        // Font Loader
        const fontLoader = new FontLoader(loadingManager)

        // Draco Loader
        const dracoLoader = new DRACOLoader(loadingManager);
        dracoLoader.setDecoderPath('assets/draco/');

        // GLTF Loader
        const gltfLoader = new GLTFLoader(loadingManager);
        gltfLoader.setDRACOLoader(dracoLoader);
        const loaders = { texture: textureLoader, cubeTexture: cubeTextureLoader, gltf: gltfLoader, font: fontLoader };
        this.loaders = loaders
        return loaders
    },
    getTextures(loaders) {
        if (this.textures) return this.textures;
        const baked = loaders.texture.load('assets/baked.jpg');
        const matCap = loaders.texture.load('assets/matCap/matCap.png');
        baked.flipY = false;
        baked.encoding = THREE.sRGBEncoding;
        const envMap = loaders.cubeTexture.load([
            '/assets/envMap/px.png',
            '/assets/envMap/nx.png',
            '/assets/envMap/py.png',
            '/assets/envMap/ny.png',
            '/assets/envMap/pz.png',
            '/assets/envMap/nz.png',
        ])
        const textures = { baked, envMap, matCap };
        this.textures = textures;
        return textures
    },
    getMaterials(bakedTextures) {
        if (this.material) return this.material
        //Baked Materials
        const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTextures });
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            roughness: 0.1,
            thickness: 1.5,
        });
        // const glassMaterial = new THREE.MeshStandardMaterial({
        //     color: 'white',
        //     depthFunc: THREE.AlwaysDepth,
        //     transparent: true,
        //     opacity: 0.2
        // });

        const material = { baked: bakedMaterial, glass: glassMaterial }
        this.material = material;
        return material;
    },
    getCamera(sizes, scene) {
        if (this.camera) return this.camera
        const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500);
        camera.position.x = 9;
        camera.position.y = 3.609;
        camera.position.z = 12.287;
        scene.add(camera)
        this.camera = camera;
        return camera;
    },
    getControls(camera, canvas) {
        if (this.controls) return this.controls
        const controls = new OrbitControls(camera, canvas);
        controls.maxDistance = 10.0
        controls.minDistance = 4.0
        controls.enableDamping = true;
        this.controls = controls
        return controls
    },
    getRenderer(canvas, sizes) {
        if (this.renderer) return this.renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        })

        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer = renderer
        return renderer;
    },
    getModel(gltfLoader, scene, material) {
        return new Promise((resolve) => {
            gltfLoader.load(
                '/assets/aircraft.glb',
                (gltf) => {
                    // console.log(gltf)
                    gltf.scene.children[0].scale.set(0.2, 0.2, 0.2)
                    gltf.scene.children[0].position.set(0, 0, 0)
                    gltf.scene.traverse((child) => {
                        if (child.name === "controllerMain") {
                            this.mainController = child;
                        }
                        if (child.name === "controllerFan") {
                            this.fanController = child;
                        }
                        child.material = material.baked
                        child.material.side = THREE.DoubleSide;
                        if (child.name === "aircraftGlass") child.material = material.glass;
                    })

                    scene.add(gltf.scene)
                    resolve()
                }
            )
        })

    },
    loadOvaylay(scene) {
        const planeGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
        const planeMaterial = new THREE.ShaderMaterial({
            transparent: true,
            vertexShader: `
            void main () {
                gl_Position = vec4(position, 1.0);
            }
            `,
            fragmentShader: `
            void main () {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1);
            }
            `
        })
        const overlay = new THREE.Mesh(planeGeometry, planeMaterial);
        this.getScene().add(overlay)
    },
    loadText(string, loaders, size, textures) {
        return new Promise((resolve, rej) => {
            loaders.font.load(
                '/assets/fonts/Shrikhand_Regular.json',
                (font) => {
                    const textGeometry = new TextGeometry(
                        string,
                        {
                            font,
                            size,
                            height: 0.2,
                            curveSegments: 12,
                            bevelEnabled: true,
                            bevelThickness: 0.03,
                            bevelSize: 0.02,
                            bevelOffset: 0,
                            bevelSegments: 5
                        }
                    )
                    const textMaterial = new THREE.MeshMatcapMaterial({ matcap: textures.matCap })
                    const text = new THREE.Mesh(textGeometry, textMaterial)
                    resolve(text)
                },

            )
        })
    },
    startEngine() {
        const anim = gsap.to(this.fanController.rotation, { z: "+=200", repeat: -1 })
        this.startEngineTimeline = anim;
    },
    flyAircraft() {

        const timeline = gsap.timeline()
        timeline
            .to(this.mainController.position, {
                z: "+=500",
                duration: 20,
                ease: 'power2.in',
            }, 'start')
            .to(this.mainController.rotation, {
                z: "-=0.5",
                delay: 3,
                duration: 2
            }, 'start')
            .to(this.mainController.rotation, {
                z: "+=1",
                duration: 3,
                ease: 'linear',
                yoyo: true,
                repeat: -1,
                yoyoEase: true,
            }, 'start+=4')
            .to(webglExperience.animatedText.position, {
                z: '30',
                x: -65,
                ease: 'power2.out',
                duration: 3,
                onComplete() {
                    // webglExperience.cameraShouldLookAt = 'text';
                    webglExperience.camera.lookAt(webglExperience.headerText.position)
                    webglExperience.headerText.material.transparent = true;
                    webglExperience.headerText.material.opacity = 0;
                    webglExperience.headerText.material.needsUpdate = true;
                }
            }, '<6')
            .to(webglExperience.animatedText.rotation, {
                y: Math.PI,
                duration: 1,

            }, '<1')
            .to(webglExperience.animatedText.position, {
                x: -6,
                duration: 2,
            }, '<')

            .to('.EndTrip', { display: 'inline-block' })
            .to('.EndTrip', { opacity: 1, duration: 0.5 })

        this.flyAircraftTimeline = timeline;
    },
    endFlightTrip() {
        this.startEngineTimeline.kill()
        this.flyAircraftTimeline.kill()
        this.mainController.position.z = -91;
        this.mainController.rotation.z = 0;
        this.mainController.position.z = -91;
        this.animatedText.rotation.y = Math.PI * 0.5;
        this.animatedText.geometry.center()
        this.animatedText.position.z = 200;
        this.headerText.material.opacity = 1;
        this.headerText.material.needsUpdate = true;
        const timeline = gsap.timeline()
        timeline
            .to(this.mainController.position, {
                duration: 2,
                z: 0
            }, 'start')
            .to('.EndTrip', { duration: 0.2, opacity: 0 }, 'start')
            .to('.EndTrip', { display: 'none' })
            .to(this.mainController.position, {
                duration: 2,
                z: 0
            })
    },
    addGuiToDom() {
        const gui = new dat.GUI({ width: 400 });
        gui.add(this.camera.position, 'x').min(0).max(100).step(0.001).name('cameraX')
        gui.add(this.camera.position, 'y').min(0).max(100).step(0.001).name('cameraY')
        gui.add(this.camera.position, 'z').min(0).max(100).step(0.001).name('cameraZ')
        gui.add(this.headerText.position, 'x').min(-50).max(50).step(0.001).name('headerTextX')
        gui.add(this.headerText.position, 'y').min(-50).max(50).step(0.001).name('headerTextY')
        gui.add(this.headerText.position, 'z').min(-50).max(50).step(0.001).name('headerTextZ')
        gui.add(this.animatedText.position, 'x').min(-150).max(150).step(0.00001).name('animatedTextX')
        gui.add(this.animatedText.position, 'y').min(-150).max(150).step(0.00001).name('animatedTextY')
        gui.add(this.animatedText.position, 'z').min(-150).max(150).step(0.00001).name('animatedTextZ')
        gui.add(this.animatedText.rotation, 'y').min(-20).max(20).step(0.00001).name('animatedTextRotationZ')
        gui.add(this.mainController.position, 'x').min(-150).max(150).step(0.00001).name('mainControllerX')
        gui.add(this.mainController.position, 'y').min(-150).max(150).step(0.00001).name('mainControllerY')
        gui.add(this.mainController.position, 'z').min(-150).max(150).step(0.00001).name('mainControllerZ')
        gui.add(this.mainController.rotation, 'z').min(-10).max(10).step(0.00001).name('mainControllerRotationZ')
    },
    tick() {
        const elaspedTime = clock.getElapsedTime();
        const deltaTime = elaspedTime - previousTime;
        previousTime = elaspedTime
        //Update controls
        this.controls.update()

        if (this.cameraShouldLookAt === 'aircraft' && this.mainController) {
            this.camera.lookAt(this.mainController.position)
        } else if (this.cameraShouldLookAt === 'text' && this.animatedText) {
            this.camera.lookAt(this.animatedText.position)
        }

        //Render
        this.renderer.render(this.scene, this.camera);

        //Call tick again on the next frame
        window.requestAnimationFrame(this.tick.bind(this));
    },
    async initialize() {
        const scene = this.getScene();
        // this.loadOvaylay()
        const sizes = this.getSizes()
        const canvas = this.getCanvas();
        const loaders = this.getLoaders();
        const texture = this.getTextures(loaders);
        const material = this.getMaterials(texture.baked);
        const headerText = await this.loadText("The Sky Is Your Limit", loaders, 1, texture)
        const animatedText = await this.loadText("TO INFINITY AND BEYOUND", loaders, 1.5, texture)
        await this.getModel(loaders.gltf, scene, material)
        const camera = this.getCamera(sizes, scene);
        const controls = this.getControls(camera, canvas);
        const renderer = this.getRenderer(canvas, sizes);
        scene.background = texture.envMap
        headerText.position.set(-9, 4, -4)
        animatedText.rotation.y = Math.PI * 0.5;
        animatedText.geometry.center()
        animatedText.position.z = 200;
        this.headerText = headerText;
        this.animatedText = animatedText;
        scene.add(headerText, animatedText)
        // this.addGuiToDom();
        window.addEventListener('resize', () => {
            //Update Sizes
            this.sizes.width = window.innerWidth
            this.sizes.height = window.innerHeight

            //Update Camera
            camera.aspect = this.sizes.width / this.sizes.height;
            camera.updateProjectionMatrix();

            // Update Renderer
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


        })
        this.tick()
    }
}

function initializeWebglExperience() {



    //Canvas
    const canvas = document.querySelector('canvas.webgl');

    // scene
    const scene = new THREE.Scene();

    /**
     * Loaders
     */
    // Texture loader
    const textureLoader = new THREE.TextureLoader();
    const cubeTextureLoader = new THREE.CubeTextureLoader();

    // Draco Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('assets/draco/');

    // GLTF Loader
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    /**
     * Textures
     */
    const bakedTextures = textureLoader.load('assets/baked.jpg');
    bakedTextures.flipY = false;
    bakedTextures.encoding = THREE.sRGBEncoding;
    const envMap = cubeTextureLoader.load([
        '/assets/envMap/px.png',
        '/assets/envMap/nx.png',
        '/assets/envMap/py.png',
        '/assets/envMap/ny.png',
        '/assets/envMap/pz.png',
        '/assets/envMap/nz.png',
    ])
    scene.background = envMap;



    /**
 * Material
 */
    //Baked Materials
    const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTextures });
    // const glassMaterial = new THREE.MeshPhysicalMaterial({
    //     transmission: 1,
    //     roughness: 0.3,
    //     clearcoat: 0.5,
    //     thickness: 1.5,
    // });
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 'white',
        depthFunc: THREE.AlwaysDepth,
        transparent: true,
        opacity: 0.2
    });

    /**
     * MODEL
     */
    let mainController = null;
    let fanController = null;
    gltfLoader.load(
        '/assets/aircraft.glb',
        (gltf) => {
            // console.log(gltf)
            gltf.scene.children[0].scale.set(0.2, 0.2, 0.2)
            gltf.scene.children[0].position.set(0, 0, 0)
            gltf.scene.traverse((child) => {
                if (child.name === "controllerMain") {
                    mainController = child;
                    // child.rotation.z -= 0.5;
                    // gsap.to(child.rotation, {
                    //     z: "+=1",
                    //     duration: 3,
                    //     ease: 'linear',
                    //     yoyo: true,
                    //     repeat: -1,
                    //     yoyoEase: true,
                    // })
                    // gsap.to(child.position, {
                    //     z: "+=500",
                    //     duration: 100,
                    //     ease: 'linear',
                    //     onUpdate: () => { camera.lookAt(child.position) }
                    // })
                }
                if (child.name === "controllerFan") {
                    fanController = child;
                    // gsap.to(child.rotation, { z: "+=200", repeat: -1 })
                }
                child.material = bakedMaterial
                child.material.side = THREE.DoubleSide;
                if (child.name === "aircraftGlass") child.material = glassMaterial;
            })

            scene.add(gltf.scene)
        }
    )




    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    window.addEventListener('resize', () => {
        //Update Sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        //Update Camera
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        // Update Renderer
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


    })

    /**
     * Camera
     */
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500);
    camera.position.x = 9;
    camera.position.y = 2.762;
    camera.position.z = 0;


    scene.add(camera);

    /**
     * Controls
     */
    const controls = new OrbitControls(camera, canvas);
    controls.maxDistance = 10.0
    controls.minDistance = 4.0
    controls.enableDamping = true;


    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    })

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Dat-Gui
    function addGuiToDom() {

        const gui = new dat.GUI({ width: 400 });
        gui.add(camera.position, 'x').min(0).max(100).step(0.001)
        gui.add(camera.position, 'y').min(0).max(100).step(0.001)
        gui.add(camera.position, 'z').min(0).max(100).step(0.001)
    }
    // addGuiToDom()


    /**
     * Animate
     */
    const clock = new THREE.Clock();
    let previousTime = 0;

    const tick = () => {
        const elaspedTime = clock.getElapsedTime();
        const deltaTime = elaspedTime - previousTime;
        previousTime = elaspedTime
        //Update controls
        controls.update()

        if (mainController) {
            // mainController.position.z += deltaTime * 8;
            // camera.position.z += deltaTime * 7;
            camera.lookAt(mainController.position)
        }

        //Render
        renderer.render(scene, camera);

        //Call tick again on the next frame
        window.requestAnimationFrame(tick);
    }
    tick()
}

export default webglExperience;
