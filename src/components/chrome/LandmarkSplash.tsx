import type { LandmarkMotif, LandmarkScene } from '@/lib/navigation/landmarks'

function Motif({ kind }: { kind: LandmarkMotif }) {
  switch (kind) {
    case 'clock-bridge':
      return <><path d="M86 476V165h82v311M95 165l32-58 32 58M112 225h30M127 165v28M105 285a22 22 0 1 0 44 0 22 22 0 0 0-44 0Zm-19 191h82M205 405h250M230 405l22-84 23 84m110 0 22-84 23 84M252 340h155M252 365h155M205 405l-22 71m272-71 22 71" /></>
    case 'university':
      return <><path d="M85 468h350M118 468V255h284v213M102 255h316l-158-103L102 255Zm51 0v213m71-213v213m72-213v213m71-213v213M230 468V358h60v110M199 205h122M260 152v-47m-18 23h36" /></>
    case 'castle':
      return <><path d="M82 470h370V242h-66v-58h-66v58H214v-58h-66v58H82v228Zm66 0V360h74v110m90 0V342h74v128M82 285h370M116 242v-45m304 45v-45" /></>
    case 'industrial':
      return <><path d="M72 470h390V325l-86 48v-48l-92 48v-48l-96 48v-82H72v179Zm35-179V172h46v119m205 179V258h50v212M94 220h37M96 250h33M218 416h38m46 0h38" /></>
    case 'harbour':
      return <><path d="M56 421c74-26 128 30 202 0s126 24 218-5M56 455c83-23 134 25 216 0s132 20 204-4M142 394l72-110 70 110H142Zm72-110v-85m0 20 45 27m-45 14-54 29M326 393h92l-18-74h-57l-17 74Zm62-74-22-65" /></>
    case 'liberty':
      return <><path d="M214 474h122l-20-58h-82l-20 58Zm36-58 12-173h27l11 173M262 243l-22-54 30 18 8-63 13 62 29-26-18 63M275 144v-40m-42 85-26-28m114 19 27-30" /></>
    case 'skyline':
      return <><path d="M64 472h410M88 472V314h62v158m28 0V238h68v234m30 0V338h55v134m30 0V190h61v282m22 0V292h47v180M105 344h28m63-66h32m66 94h20m85-144h25" /></>
    case 'tower':
      return <><path d="M244 477h80l-22-176-18-122h-2l-18 122-20 176Zm10-104h59M264 301h39M274 232h19M283 179V91m-33 386h68M90 477h112V348H90v129Zm274 0h100V322H364v155" /></>
    case 'opera':
      return <><path d="M66 443h400M94 427c56-128 118-184 186-201-18 97-70 168-186 201Zm116 0c42-108 99-178 180-210-5 101-60 174-180 210Zm119 0c31-75 74-120 126-139 3 70-39 117-126 139ZM66 443c94 21 288 20 400 0" /></>
    case 'tram':
      return <><path d="M112 422V248c0-36 27-62 62-62h166c36 0 62 26 62 62v174H112Zm0-67h290M151 231h212M165 422l-27 56m211-56 27 56M150 478h225M155 385h38m127 0h38M208 186l48-74 48 74" /></>
    case 'coast':
      return <><path d="M54 420c80-28 132 31 212 0s133 26 212-3M54 455c92-26 137 26 226 0s131 21 198-4M128 395V237m0 0c-45-9-70 5-91 37 39-1 66 9 91 31m0-68c41-18 80-5 105 30-45-4-76 7-105 38m0-68c2-45-16-77-51-101-3 46 15 77 51 101M389 372a54 54 0 1 0 0-108 54 54 0 0 0 0 108Z" /></>
    case 'fort':
      return <><path d="M73 466h396V280l-55-28-55 28-55-28-55 28-55-28-55 28-66-28v214Zm54-174v174m276-174v174M202 466V355h138v111M73 334h396M249 280v-68h55v40" /></>
    case 'desert':
      return <><path d="M52 449c101-94 186-104 276-28 57 47 95 49 154 8M66 475c94-69 182-71 269-15 48 31 89 28 136 6M263 414l23-236 22 236M279 250h16M283 210h9M286 178V91M343 426V268h47v170M113 414v-93h43v65" /></>
    case 'dome':
      return <><path d="M78 468h392M124 468V322h300v146M166 322c9-94 71-151 108-151s99 57 108 151H166Zm108-151v-70m-22 22h44M169 468V365h55v103m100 0V365h55v103M124 322h300" /></>
    case 'mountains':
      return <><path d="M38 439 168 231l67 91 72-151 171 268H38Zm83-75 47-133 33 45m60-9 46-96 55 87M44 457c94-25 151 25 238 0s142 22 196-3" /></>
  }
}

export function LandmarkSplash({ scene }: { scene: LandmarkScene }) {
  return (
    <div className="he-landmark-splash absolute inset-0" data-place={scene.key}>
      <svg viewBox="0 0 1200 700" fill="none" aria-hidden="true" focusable="false">
        <g className="he-landmark-doodles" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M93 111h102l-18 78h-66l-18-78Zm13 17 73 45M104 173l76-44M1010 132l48-32 48 32-48 31-48-31Zm18 14v38c16 15 44 15 60 0v-38M1058 100v-26" />
          <path d="M452 100c24-20 53-19 77 1m-39-20v49m-31-23h62M793 91l55 18-55 18 13-18-13-18Z" />
        </g>
        <g className="he-landmark-secondary" transform="translate(730 138) scale(.72)" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <Motif kind={scene.secondary} />
        </g>
        <g className="he-landmark-primary" transform="translate(310 105) scale(1.12)" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <Motif kind={scene.motif} />
        </g>
        <path className="he-landmark-ground" d="M54 603c176-35 311 31 474 0s308 30 618-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className="he-landmark-label">{scene.label}</p>
    </div>
  )
}
