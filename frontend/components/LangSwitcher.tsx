import {useLang} from '@/lib/i18n';

// Round English (UK) flag SVG
const EngFlag = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 512 512" 
    className="rounded-full overflow-hidden flex-shrink-0"
  >
    <mask id="eng-mask">
      <circle cx="256" cy="256" r="256" fill="#fff"/>
    </mask>
    <g mask="url(#eng-mask)">
      <path fill="#eee" d="m0 0 8 22-8 23v23l32 54-32 54v32l32 48-32 48v32l32 54-32 54v68l22-8 23 8h23l54-32 54 32h32l48-32 48 32h32l54-32 54 32h68l-8-22 8-23v-23l-32-54 32-54v-32l-32-48 32-48v-32l-32-54 32-54V0l-22 8-23-8h-23l-54 32-54-32h-32l-48 32-48-32h-32l-54 32L68 0H0z"/>
      <path fill="#0052b4" d="M336 0v108L444 0Zm176 68L404 176h108zM0 176h108L0 68ZM68 0l108 108V0Zm108 512V404L68 512ZM0 444l108-108H0Zm512-108H404l108 108Zm-68 176L336 404v108z"/>
      <path fill="#d80027" d="M0 0v45l131 131h45L0 0zm208 0v208H0v96h208v208h96V304h208v-96H304V0h-96zm259 0L336 131v45L512 0h-45zM176 336 0 512h45l131-131v-45zm160 0 176 176v-45L381 336h-45z"/>
    </g>
  </svg>
);

// Round Russian flag SVG
const RuFlag = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 512 512" 
    className="rounded-full overflow-hidden flex-shrink-0"
  >
    <mask id="ru-mask">
      <circle cx="256" cy="256" r="256" fill="#fff"/>
    </mask>
    <g mask="url(#ru-mask)">
      <path fill="#0052b4" d="M512 170v172l-256 32L0 342V170l256-32z"/>
      <path fill="#eee" d="M512 0v170H0V0Z"/>
      <path fill="#d80027" d="M512 342v170H0V342Z"/>
    </g>
  </svg>
);

function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full border border-light/20 bg-dark/30">
      <button
       className={`flex cursor-pointer items-center justify-center flex-1 rounded-full px-2 py-2 text-sm font-semibold transition border-2 ${
        lang === 'eng' 
          ? 'border-light bg-light-hover/15 text-dark shadow-sm' 
          : 'border-transparent text-light/60 hover:border-light/40 hover:bg-light/5 hover:text-light'
      }`}
      onClick={() => setLang('eng')}
      >
        <EngFlag />
        {/* <span>EN</span> */}
      </button>
      <button
        className={`flex cursor-pointer items-center justify-center flex-1 rounded-full px-2 py-2 text-sm font-semibold transition border-2 ${
          lang === 'ru' 
            ? 'border-light bg-light-hover/15 text-dark shadow-sm' 
            : 'border-transparent text-light/60 hover:border-light/40 hover:bg-light/5 hover:text-light'
        }`}
        onClick={() => setLang('ru')}
      >
        <RuFlag />
        {/* <span>RU</span> */}
      </button>
    </div>
    
  );
}

export default LangSwitcher;