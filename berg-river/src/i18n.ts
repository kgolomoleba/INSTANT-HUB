import { createContext, useContext } from 'react'

export type Lang = 'en' | 'af'

/**
 * All on-screen text, in English and Afrikaans. Use {name} for values.
 * Afrikaans: written carefully, but should be checked by a native speaker.
 */
const en = {
  // app
  'app.title': 'Berg River Farms',
  'app.tagline':
    'How green your farm is, compared with last year, next to the weather.',
  'app.lang': 'Taal: Afrikaans',
  'app.offline':
    "You're offline. You can still look at farms you've already opened.",
  'app.howItWorks':
    'How it works: green cover is measured by satellite and is best read as a trend, not an exact figure. Weather comes from Open-Meteo, crops from the Western Cape crop census. Data you have looked at is kept on this phone so it opens faster.',
  // account
  'account.local': 'Farms saved on this device',
  'account.signIn': 'Sign in to save farms',
  'account.signOut': 'Sign out',
  'account.email': 'Your email address',
  'account.send': 'Email me a link',
  'account.sending': 'Sending…',
  'account.sent': 'Check {email} for a sign-in link.',
  'account.cancel': 'Cancel',
  // comparing
  'cmp.title': 'Compare',
  'cmp.winter': 'Winter season',
  'cmp.winterHint': 'May to October (wheat, canola)',
  'cmp.summer': 'Summer season',
  'cmp.summerHint': 'November to April (vineyards, orchards)',
  'cmp.year': 'Whole year',
  'cmp.yearHint': 'Last 12 months against the 12 before',
  'cmp.recent': 'Last 3 months',
  'cmp.recentHint': 'Last 90 days against the same time last year',
  'cmp.custom': 'Own dates',
  'cmp.summary': 'Comparing {b} with {a}',
  'cmp.earlier': 'Earlier',
  'cmp.later': 'Later',
  'cmp.from': 'From',
  'cmp.to': 'To',
  'cmp.yearBack': '1 year back',
  'cmp.yearFwd': '1 year on',
  'cmp.season': 'This farm usually compares the {season}.',
  'err.dates': 'Pick both dates.',
  'err.backwards': 'The end date is before the start date.',
  'err.tooLate': 'Weather is only available up to {date}.',
  'err.tooEarly': 'Satellite readings start in February 2000.',
  'err.tooLong': 'Keep each period to one year or less.',
  // finding farms
  'find.title': 'Find your farm',
  'find.myLocation': '📍 Use my location',
  'find.locating': 'Finding you…',
  'find.noLocation': "Couldn't get your location. Pick your town instead.",
  'find.town': 'Or go to a town',
  'find.townPick': 'Choose a town…',
  'find.tapFarm': 'Now tap inside your farm on the map.',
  'find.lookingUp': 'Looking up the farm…',
  'find.noBoundary': 'No farm found there. Zoom in and tap inside a farm.',
  'find.boundaryError':
    "Couldn't look up farm boundaries right now. Try again, or add the farm as a point.",
  'find.added': 'Added {name} ({ha}).',
  'find.outside':
    '{name} looks like it is outside the Berg River area. Add it anyway?',
  'find.addAnyway': 'Add anyway',
  'find.namePoint': 'Name this farm',
  'find.pointDefault': 'My farm',
  'find.add': 'Add farm',
  'map.label': 'Map of the Berg River area',
  'map.river': 'Berg River',
  'map.area': 'Berg River area',
  // farm list
  'farms.title': 'Your farms',
  'farms.none': 'No farms yet.',
  'farms.loading': 'Loading your farms…',
  'farms.find': 'Find a farm',
  'farms.remove': 'Remove',
  'farms.removeConfirm': 'Remove {name}? Its diary notes are removed too.',
  'farms.point': 'point',
  'farms.moved': 'Saved {n} farm(s) from this device to your account.',
  'farms.loadError':
    "Couldn't load your saved farms. Check your internet and refresh.",
  'farms.saveError':
    "Couldn't save that to your account. Check your internet and try again.",
  'farms.other': 'Other ways to add farms',
  'farms.import': 'Import farm outlines from a file (KML or GeoJSON)',
  'farms.imported': 'Added {n} farm(s) from {file}.',
  'farms.importNone': 'No farm outlines found in {file}.',
  'farms.importError': "Couldn't read {file}.",
  'farms.advanced': 'Advanced: boundary map service',
  'farms.cfm': "Using Cape Farm Mapper's farm boundaries.",
  'farms.useCfm': 'Use Cape Farm Mapper',
  'farms.badService': "That address doesn't look right.",
  'farms.switch': 'Choose a farm',
  'farms.toMap': 'Map & add farms ↓',
  // welcome
  'welcome.title': 'Welcome! Three steps:',
  'welcome.1': 'Find your farm: use your location or pick your town.',
  'welcome.2':
    'Tap inside your farm on the map. Its outline and size load by themselves.',
  'welcome.3':
    'See at a glance if the farm is greener or drier than last year.',
  'welcome.signIn':
    'Sign in (top of the page) to see your farms on any phone or computer.',
  // farm view
  'farm.rename': 'Rename',
  'farm.save': 'Save',
  'farm.cancel': 'Cancel',
  'farm.name': 'Farm name',
  'farm.meta.boundary': '{ha} · outline from {source}',
  'farm.meta.cfm': 'Cape Farm Mapper',
  'farm.meta.file': 'your file',
  'farm.meta.point': 'Point on the map · readings from {area}',
  'farm.area.square': 'the area around it (2 × 2 km)',
  'farm.area.pixel': 'only that spot',
  'farm.season': 'Main season',
  'season.winter': 'winter season',
  'season.summer': 'summer season',
  'season.year': 'whole year',
  'farm.download': 'Download (spreadsheet)',
  'farm.print': 'Print',
  'farm.share': 'Share',
  'farm.copied': 'Link copied',
  'farm.updated': 'Numbers updated {when}',
  'farm.refresh': 'Refresh',
  'farm.refreshing': 'Refreshing…',
  'tab.overview': 'Summary',
  'tab.charts': 'Charts',
  'tab.crops': 'Crops',
  'tab.diary': 'Diary',
  'farm.satellite.sentinel-2': 'Satellite: Sentinel-2 (sharp, every 5 days)',
  'farm.satellite.modis': 'Satellite: NASA MODIS (every 16 days)',
  // problems
  'problem.satellite': "Couldn't get the satellite readings.",
  'problem.weather': "Couldn't get the weather.",
  'problem.hint': 'Check your internet. What did load is shown below.',
  'problem.retry': 'Try again',
  'problem.details': 'Details',
  // verdict
  'verdict.better': 'Greener than {a}',
  'verdict.worse': 'Less green than {a}',
  'verdict.same': 'About the same as {a}',
  'verdict.wetter': 'Wetter than {a}',
  'verdict.drier': 'Drier than {a}',
  'verdict.sameRain': 'About as much rain as {a}',
  'verdict.loading': 'Checking your farm…',
  'verdict.why.cover': 'Green cover {dir} {n} points ({b}% vs {a}%).',
  'verdict.why.rain': 'Rain {dir} {pct}% ({b} mm vs {a} mm).',
  'verdict.up': 'up',
  'verdict.down': 'down',
  // figures
  'fig.cover': 'Green cover',
  'fig.rain': 'Rain',
  'fig.dry': 'Longest dry spell',
  'fig.hot': 'Hot days (35 °C+)',
  'fig.high': 'Average daytime high',
  'fig.peak': 'Greenest point',
  'fig.rainDays': 'Days with rain',
  'fig.frost': 'Frost days',
  'fig.balance': 'Rain minus evaporation',
  'fig.ndvi': 'Satellite index (NDVI)',
  'fig.more': 'More details',
  'fig.less': 'Fewer details',
  'fig.more_than': 'more than {a}',
  'fig.less_than': 'less than {a}',
  'fig.same_as': 'same as {a}',
  'unit.days': 'days',
  'fig.stillLoading': 'Still loading some readings…',
  // explain
  'explain.button': '✦ Explain in plain words',
  'explain.busy': 'Writing…',
  'explain.foot':
    'Written by AI (Claude) from the figures above. Check anything important.',
  'explain.error':
    "Couldn't write an explanation right now. Try again in a minute.",
  // charts
  'chart.cover': 'Green cover through the season (%)',
  'chart.rain': 'Rain so far (mm)',
  'chart.note': 'diary note',
  'chart.table': 'Show satellite readings as a table',
  'chart.hideTable': 'Hide the table',
  'chart.period': 'Period',
  'chart.date': 'Reading from',
  // crops
  'crops.title': 'Crops on this farm',
  'crops.source': 'Western Cape crop census',
  'crops.point':
    'This farm is a point, so only the field at that point is shown.',
  'crops.loading': 'Loading crops…',
  'crops.error': "Couldn't load the crop census right now.",
  'crops.winter': 'Winter',
  'crops.summer': 'Summer',
  'crops.none': 'No crops recorded',
  'crops.na': 'Not available',
  'crops.irrigated': 'irrigated',
  'crops.dry': 'dry land',
  // diary
  'diary.hint':
    'Write down what happened on the farm: planting, spraying, harvest, hail, fire, flooding. Notes show as ◆ on the charts.',
  'diary.placeholder': 'e.g. Planted wheat',
  'diary.add': 'Add note',
  'diary.none': 'No notes yet.',
  'diary.date': 'Date',
  'diary.note': 'Note',
  'diary.delete': 'Delete note',
  'diary.saveError': "Couldn't save the note to your account.",
  // all farms
  'all.title': 'All your farms',
  'all.hint':
    'Same comparison for every farm. Biggest drop in green cover first.',
  'all.run': 'Compare all farms',
  'all.again': 'Compare again',
  'all.busy': 'Comparing… {done}/{total}',
  'all.download': 'Download (spreadsheet)',
  'all.farm': 'Farm',
  'all.cover': 'Green cover',
  'all.change': 'Change',
  'all.rain': 'Rain',
  'all.dry': 'Dry spell',
  'all.failed': "Couldn't load",
  'all.waiting': 'Waiting…',
  // summary sentences (Summary tab)
  'sum.coverSame':
    'Green cover was about the same in {b} as in {a} ({vb}% vs {va}%).',
  'sum.coverDiff':
    'Green cover was {n} points {dir} in {b} ({vb}%) than in {a} ({va}%).',
  'sum.higher': 'higher',
  'sum.lower': 'lower',
  'sum.rainSame': 'Rain was similar: {vb} mm vs {va} mm.',
  'sum.rainDiff': '{b} had {n}% {dir} rain: {vb} mm vs {va} mm.',
  'sum.more': 'more',
  'sum.less': 'less',
  'sum.dryLonger': 'The longest dry spell grew from {va} to {vb} days.',
  'sum.dryShorter': 'The longest dry spell shrank from {va} to {vb} days.',
  'sum.hot': 'Days at 35 °C or hotter: {vb} in {b}, {va} in {a}.',
  'sum.temp': 'Days were on average {n} °C {dir} in {b}.',
  'sum.warmer': 'warmer',
  'sum.cooler': 'cooler',
  // dialog
  'dialog.ok': 'OK',
  'dialog.cancel': 'Cancel',
} as const

export type Key = keyof typeof en

const af: Record<Key, string> = {
  'app.title': 'Bergrivier-plase',
  'app.tagline': 'Hoe groen jou plaas is teenoor verlede jaar, langs die weer.',
  'app.lang': 'Language: English',
  'app.offline':
    'Jy is vanlyn. Jy kan nog plase bekyk wat jy reeds oopgemaak het.',
  'app.howItWorks':
    'Hoe dit werk: groenbedekking word met satelliet gemeet en lees die beste as ’n neiging, nie ’n presiese syfer nie. Die weer kom van Open-Meteo, gewasse van die Wes-Kaapse gewassensus. Data wat jy bekyk het, word op hierdie foon gehou sodat dit vinniger oopmaak.',
  'account.local': 'Plase op hierdie toestel gestoor',
  'account.signIn': 'Teken in om plase te stoor',
  'account.signOut': 'Teken uit',
  'account.email': 'Jou e-posadres',
  'account.send': 'E-pos my ’n skakel',
  'account.sending': 'Stuur…',
  'account.sent': 'Kyk in {email} vir ’n aanmeldskakel.',
  'account.cancel': 'Kanselleer',
  'cmp.title': 'Vergelyk',
  'cmp.winter': 'Winterseisoen',
  'cmp.winterHint': 'Mei tot Oktober (koring, canola)',
  'cmp.summer': 'Somerseisoen',
  'cmp.summerHint': 'November tot April (wingerde, boorde)',
  'cmp.year': 'Hele jaar',
  'cmp.yearHint': 'Laaste 12 maande teenoor die 12 daarvoor',
  'cmp.recent': 'Laaste 3 maande',
  'cmp.recentHint': 'Laaste 90 dae teenoor dieselfde tyd verlede jaar',
  'cmp.custom': 'Eie datums',
  'cmp.summary': 'Vergelyk {b} met {a}',
  'cmp.earlier': 'Vroeër',
  'cmp.later': 'Later',
  'cmp.from': 'Van',
  'cmp.to': 'Tot',
  'cmp.yearBack': '1 jaar terug',
  'cmp.yearFwd': '1 jaar vorentoe',
  'cmp.season': 'Hierdie plaas vergelyk gewoonlik die {season}.',
  'err.dates': 'Kies albei datums.',
  'err.backwards': 'Die einddatum is voor die begindatum.',
  'err.tooLate': 'Weer is net beskikbaar tot {date}.',
  'err.tooEarly': 'Satellietlesings begin in Februarie 2000.',
  'err.tooLong': 'Hou elke tydperk tot een jaar of minder.',
  'find.title': 'Vind jou plaas',
  'find.myLocation': '📍 Gebruik my ligging',
  'find.locating': 'Soek jou ligging…',
  'find.noLocation': 'Kon nie jou ligging kry nie. Kies eerder jou dorp.',
  'find.town': 'Of gaan na ’n dorp',
  'find.townPick': 'Kies ’n dorp…',
  'find.tapFarm': 'Tik nou binne-in jou plaas op die kaart.',
  'find.lookingUp': 'Soek die plaas…',
  'find.noBoundary':
    'Geen plaas daar gevind nie. Zoem in en tik binne-in ’n plaas.',
  'find.boundaryError':
    'Kon nie nou plaasgrense opsoek nie. Probeer weer, of voeg die plaas as ’n punt by.',
  'find.added': '{name} ({ha}) bygevoeg.',
  'find.outside':
    '{name} lyk of dit buite die Bergrivier-gebied is. Voeg dit tog by?',
  'find.addAnyway': 'Voeg tog by',
  'find.namePoint': 'Gee hierdie plaas ’n naam',
  'find.pointDefault': 'My plaas',
  'find.add': 'Voeg plaas by',
  'map.label': 'Kaart van die Bergrivier-gebied',
  'map.river': 'Bergrivier',
  'map.area': 'Bergrivier-gebied',
  'farms.title': 'Jou plase',
  'farms.none': 'Nog geen plase nie.',
  'farms.loading': 'Laai jou plase…',
  'farms.find': 'Soek ’n plaas',
  'farms.remove': 'Verwyder',
  'farms.removeConfirm': 'Verwyder {name}? Die dagboeknotas word ook verwyder.',
  'farms.point': 'punt',
  'farms.moved': '{n} plaas/plase van hierdie toestel na jou rekening gestoor.',
  'farms.loadError':
    'Kon nie jou gestoorde plase laai nie. Kyk jou internet en laai weer.',
  'farms.saveError':
    'Kon dit nie in jou rekening stoor nie. Kyk jou internet en probeer weer.',
  'farms.other': 'Ander maniere om plase by te voeg',
  'farms.import': 'Laai plaasgrense uit ’n lêer (KML of GeoJSON)',
  'farms.imported': '{n} plaas/plase uit {file} bygevoeg.',
  'farms.importNone': 'Geen plaasgrense in {file} gevind nie.',
  'farms.importError': 'Kon nie {file} lees nie.',
  'farms.advanced': 'Gevorderd: grensekaartdiens',
  'farms.cfm': 'Gebruik Cape Farm Mapper se plaasgrense.',
  'farms.useCfm': 'Gebruik Cape Farm Mapper',
  'farms.badService': 'Daardie adres lyk nie reg nie.',
  'farms.switch': 'Kies ’n plaas',
  'farms.toMap': 'Kaart en plase byvoeg ↓',
  'welcome.title': 'Welkom! Drie stappe:',
  'welcome.1': 'Vind jou plaas: gebruik jou ligging of kies jou dorp.',
  'welcome.2':
    'Tik binne-in jou plaas op die kaart. Die grens en grootte laai vanself.',
  'welcome.3':
    'Sien met een oogopslag of die plaas groener of droër as verlede jaar is.',
  'welcome.signIn':
    'Teken in (bo-aan die bladsy) om jou plase op enige foon of rekenaar te sien.',
  'farm.rename': 'Hernoem',
  'farm.save': 'Stoor',
  'farm.cancel': 'Kanselleer',
  'farm.name': 'Plaasnaam',
  'farm.meta.boundary': '{ha} · grens van {source}',
  'farm.meta.cfm': 'Cape Farm Mapper',
  'farm.meta.file': 'jou lêer',
  'farm.meta.point': 'Punt op die kaart · lesings van {area}',
  'farm.area.square': 'die gebied rondom (2 × 2 km)',
  'farm.area.pixel': 'net daardie plek',
  'farm.season': 'Hoofseisoen',
  'season.winter': 'winterseisoen',
  'season.summer': 'somerseisoen',
  'season.year': 'hele jaar',
  'farm.download': 'Laai af (sigblad)',
  'farm.print': 'Druk',
  'farm.share': 'Deel',
  'farm.copied': 'Skakel gekopieer',
  'farm.updated': 'Syfers opgedateer {when}',
  'farm.refresh': 'Verfris',
  'farm.refreshing': 'Verfris…',
  'tab.overview': 'Opsomming',
  'tab.charts': 'Grafieke',
  'tab.crops': 'Gewasse',
  'tab.diary': 'Dagboek',
  'farm.satellite.sentinel-2': 'Satelliet: Sentinel-2 (skerp, elke 5 dae)',
  'farm.satellite.modis': 'Satelliet: NASA MODIS (elke 16 dae)',
  'problem.satellite': 'Kon nie die satellietlesings kry nie.',
  'problem.weather': 'Kon nie die weer kry nie.',
  'problem.hint': 'Kyk jou internet. Wat wel gelaai het, word hieronder gewys.',
  'problem.retry': 'Probeer weer',
  'problem.details': 'Besonderhede',
  'verdict.better': 'Groener as {a}',
  'verdict.worse': 'Minder groen as {a}',
  'verdict.same': 'Omtrent dieselfde as {a}',
  'verdict.wetter': 'Natter as {a}',
  'verdict.drier': 'Droër as {a}',
  'verdict.sameRain': 'Omtrent soveel reën as {a}',
  'verdict.loading': 'Kyk na jou plaas…',
  'verdict.why.cover': 'Groenbedekking {dir} {n} punte ({b}% teenoor {a}%).',
  'verdict.why.rain': 'Reën {dir} {pct}% ({b} mm teenoor {a} mm).',
  'verdict.up': 'op',
  'verdict.down': 'af',
  'fig.cover': 'Groenbedekking',
  'fig.rain': 'Reën',
  'fig.dry': 'Langste droë tydperk',
  'fig.hot': 'Warm dae (35 °C+)',
  'fig.high': 'Gemiddelde dagtemperatuur',
  'fig.peak': 'Groenste punt',
  'fig.rainDays': 'Dae met reën',
  'fig.frost': 'Rypdae',
  'fig.balance': 'Reën min verdamping',
  'fig.ndvi': 'Satellietindeks (NDVI)',
  'fig.more': 'Meer besonderhede',
  'fig.less': 'Minder besonderhede',
  'fig.more_than': 'meer as {a}',
  'fig.less_than': 'minder as {a}',
  'fig.same_as': 'dieselfde as {a}',
  'unit.days': 'dae',
  'fig.stillLoading': 'Laai nog sommige lesings…',
  'explain.button': '✦ Verduidelik in gewone woorde',
  'explain.busy': 'Skryf…',
  'explain.foot':
    'Deur KI (Claude) geskryf uit die syfers hierbo. Kontroleer enigiets belangriks.',
  'explain.error':
    'Kon nie nou ’n verduideliking skryf nie. Probeer weer oor ’n minuut.',
  'chart.cover': 'Groenbedekking deur die seisoen (%)',
  'chart.rain': 'Reën tot dusver (mm)',
  'chart.note': 'dagboeknota',
  'chart.table': 'Wys satellietlesings as ’n tabel',
  'chart.hideTable': 'Steek die tabel weg',
  'chart.period': 'Tydperk',
  'chart.date': 'Lesing vanaf',
  'crops.title': 'Gewasse op hierdie plaas',
  'crops.source': 'Wes-Kaapse gewassensus',
  'crops.point':
    'Hierdie plaas is ’n punt, so net die land by daardie punt word gewys.',
  'crops.loading': 'Laai gewasse…',
  'crops.error': 'Kon nie nou die gewassensus laai nie.',
  'crops.winter': 'Winter',
  'crops.summer': 'Somer',
  'crops.none': 'Geen gewasse aangeteken nie',
  'crops.na': 'Nie beskikbaar nie',
  'crops.irrigated': 'besproei',
  'crops.dry': 'droëland',
  'diary.hint':
    'Skryf neer wat op die plaas gebeur het: plant, spuit, oes, hael, brand, vloed. Notas wys as ◆ op die grafieke.',
  'diary.placeholder': 'bv. Koring geplant',
  'diary.add': 'Voeg nota by',
  'diary.none': 'Nog geen notas nie.',
  'diary.date': 'Datum',
  'diary.note': 'Nota',
  'diary.delete': 'Vee nota uit',
  'diary.saveError': 'Kon nie die nota in jou rekening stoor nie.',
  'all.title': 'Al jou plase',
  'all.hint':
    'Dieselfde vergelyking vir elke plaas. Grootste daling in groenbedekking eerste.',
  'all.run': 'Vergelyk alle plase',
  'all.again': 'Vergelyk weer',
  'all.busy': 'Vergelyk… {done}/{total}',
  'all.download': 'Laai af (sigblad)',
  'all.farm': 'Plaas',
  'all.cover': 'Groenbedekking',
  'all.change': 'Verandering',
  'all.rain': 'Reën',
  'all.dry': 'Droë tydperk',
  'all.failed': 'Kon nie laai nie',
  'all.waiting': 'Wag…',
  'sum.coverSame':
    'Groenbedekking was omtrent dieselfde in {b} as in {a} ({vb}% teenoor {va}%).',
  'sum.coverDiff':
    'Groenbedekking was {n} punte {dir} in {b} ({vb}%) as in {a} ({va}%).',
  'sum.higher': 'hoër',
  'sum.lower': 'laer',
  'sum.rainSame': 'Reën was soortgelyk: {vb} mm teenoor {va} mm.',
  'sum.rainDiff': '{b} het {n}% {dir} reën gehad: {vb} mm teenoor {va} mm.',
  'sum.more': 'meer',
  'sum.less': 'minder',
  'sum.dryLonger':
    'Die langste droë tydperk het van {va} tot {vb} dae gegroei.',
  'sum.dryShorter':
    'Die langste droë tydperk het van {va} tot {vb} dae gekrimp.',
  'sum.hot': 'Dae van 35 °C of warmer: {vb} in {b}, {va} in {a}.',
  'sum.temp': 'Dae was gemiddeld {n} °C {dir} in {b}.',
  'sum.warmer': 'warmer',
  'sum.cooler': 'koeler',
  'dialog.ok': 'OK',
  'dialog.cancel': 'Kanselleer',
}

const dicts: Record<Lang, Record<Key, string>> = { en, af }
export const KEYS = Object.keys(en) as Key[]

export type T = (key: Key, vars?: Record<string, string | number>) => string

export function makeT(lang: Lang): T {
  const d = dicts[lang]
  return (key, vars) => {
    let s = d[key] ?? en[key] ?? key
    if (vars)
      for (const [k, v] of Object.entries(vars))
        s = s.split(`{${k}}`).join(String(v))
    return s
  }
}

export const LANG_KEY = 'berg-river:lang'
export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'af') return saved
  } catch {
    /* ignore */
  }
  return typeof navigator !== 'undefined' && /^af\b/i.test(navigator.language)
    ? 'af'
    : 'en'
}

export const locale = (lang: Lang) => (lang === 'af' ? 'af-ZA' : 'en-ZA')

export const I18n = createContext<{ lang: Lang; t: T }>({
  lang: 'en',
  t: makeT('en'),
})
export const useI18n = () => useContext(I18n)
