import Head from 'next/head'
import { useEffect, useState } from 'react'
import webglExperience from '../three.js'

let isFirstRender = true;
export default function Home() {
  const [isStartEngine, setIsStartEngine] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const onStartEngine = () => {
    if (isStartEngine) return
    setIsStartEngine(true)
    webglExperience.startEngine()
  }
  const flyAircarft = () => {
    if (isFlying) return
    setIsFlying(true);
    webglExperience.flyAircraft()

  }
  const endTrip = () => {
    webglExperience.endFlightTrip()
    setIsFlying(false)
    setIsStartEngine(false)
  }
  useEffect(() => {
    if (isFirstRender) {
      webglExperience.initialize()
      isFirstRender = false
    }
  }, [])
  return (
    <div>
      <Head>
        <title>Aircarft Created in Blender</title>
        <meta name="This is an Aircraft created in blender and displayed on the web with threeJs" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='relative h-screen'>
        <div data-name='overlay' className='bg-black fixed w-full h-full z-20 '></div>
        <div data-name='loadingBar' className='fixed text-right top-[50%] w-full z-30 bg-white h-[2px] scale-x-[0] origin-top-left'>
          <small data-name='loadingFigure' className='w-full left-0 absolute font-bold text-sky-700'>0%</small>
        </div>
        <h1 className='text-[58px] absolute w-fit top-6 left-3 z-10 font-bold'>
          <svg className='h-[200px]' viewBox="0 0 425 300">
            <path className='fill-transparent' id="curve" d="M6,150C49.63,93,105.79,36.65,156.2,47.55,207.89,58.74,213,131.91,264,150c40.67,14.43,108.57-6.91,229-145" />
            <text className={` fill-sky-700`} x="25">
              <textPath xlinkHref="#curve">
                SKY KING ROCKS
                <animate attributeName="startOffset" from="0%" to="100%" begin="0s" dur="10s" repeatCount="indefinite" keyTimes="0;1" />
              </textPath>
            </text>
          </svg>
        </h1>
        <canvas className='webgl absolute w-full h-full top-o left-0 outline-none'></canvas>
        {
          !isStartEngine &&
          <button
            onClick={onStartEngine}
            className='absolute w-fit h-fit p-5 rounded-full animate-bounce transition-all duration-700 font-bold text-white z-10 bottom-3 left-3 bg-sky-700 border-2 border-sky-700 md:p-10 md:text-2xl hover:text-sky-700 hover:bg-transparent'>
            Start <br /> Engine</button>
        }

        <button
          onClick={endTrip}
          className='EndTrip absolute hidden w-fit h-fit p-5 rounded-full animate-bounce transition-all duration-700 font-bold text-white z-10 bottom-3 left-[50%] translate-x-[-50%] bg-sky-700 border-2 border-sky-700 md:p-10 md:text-2xl hover:text-sky-700 hover:bg-transparent'>
          End Trip</button>

        {
          (isStartEngine && !isFlying) && <button
            onClick={flyAircarft}
            className='absolute w-fit h-fit p-5 rounded-full animate-bounce transition-all duration-700 font-bold text-white z-10 bottom-3 right-3 bg-sky-700 border-2 border-sky-700 md:p-10 md:text-2xl hover:text-sky-700 hover:bg-transparent'
          >FLY</button>
        }

      </main>
    </div>
  )
}
