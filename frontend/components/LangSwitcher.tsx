import {useLang} from '@/lib/i18n';

function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-2xl border border-light/10 bg-dark/30 p-1">
      <button
       className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        lang === 'eng' ? 'bg-light text-dark shadow-sm' : 'text-light/60 hover:text-light'
      }`}
      onClick={() => setLang('eng')}
      >
        EN
      </button>
      <button
        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          lang === 'ru' ? 'bg-light text-dark shadow-sm' : 'text-light/60 hover:text-light'
        }`}
        onClick={() => setLang('ru')}
      >
        RU
      </button>
    </div>
    
  );
}

export default LangSwitcher;