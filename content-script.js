'use strict';

const remoteFetch = (url, type, option) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ url, type, option }, res => {
      if (res) {
        if (res.error) {
          reject(new Error(res.error));

          return;
        }
        if (res.result) {
          if (type === 'buffer') {
            resolve(Uint8Array.from(res.result).buffer);
          }
          else {
            resolve(res.result);
          }

          return;
        }
      }
      else {
        reject('Something went wrong.');
      }
    });
  })
}

const convert = (ab, relatives) => {
  const td = new TextDecoder('EUC-JP');
  const parser = new DOMParser();
  const document = parser.parseFromString(td.decode(ab), 'text/html');
  const tr = document.querySelectorAll('.ProfileDataTable tr');

  for (let i = 0; i < tr.length; i++) {
    const th = tr[i].getElementsByTagName('th');

    if (th[0].innerHTML == '馬名の意味') {
      const naming = tr[i].cloneNode(true);

      relatives.parentNode.insertBefore(naming, relatives);
    }
    else if (th[0].innerHTML == '兄弟馬') {
      relatives.innerHTML = tr[i].innerHTML.replace(/\"https:\/\/[^\/]+\.netkeiba\.com\//g, '\"\/');

      return;
    }
  }
}

window.addEventListener('DOMContentLoaded', event => {
  if (window.location.href.match(/https:\/\/[^\/]*sp\.netkeiba\.com/) &&
      !(window.location.href.match(/https:\/\/(nar)/) && !window.location.href.match(/(\/top\/|\/race\/|\/odds\/|\/yoso\/)/) ||
        window.location.href.match(/https:\/\/(photo|user|tck)/) || window.location.href.match(/(\?pid=user_|\/barometer\/)/))) {
    window.location.replace(window.location.href.replace(/sp\./, '')
    .replace(/(race)\/race_(result)\.html/, '$1/$2.html')
    .replace(/(horse)\/(brood)?(sire|mare)(_detail|_horse)\.html\?id=([0-9a-f]+)\&?/, '$1/$3/$5/?')
    .replace(/yoso_(mark_list)\.html/, '$1.html')
    .replace(/\/\?pid=race_thisweek\&?/, '/race/search.html?')
    .replace(/\/\?pid=(payback_list)\&?/, '/top/$1.html?')
    .replace(/\/\?pid=(race_tendency|tendency_calendar)\&?/, '/top/race_trend.html?')
    .replace(/tendency_calendar\.html/, 'race_trend.html')
    .replace(/(result)\/year/, '$1')
    .replace(/(jockey|trainer)\/result\/grade\/([0-9]+)\/\??/, '?pid=$1_select&id=$2&year=0000&mode=gw&')
    .replace(/(jockey|trainer|horse|owner|breeder)\/(jockey_select|trainer_select|jockey_leading|sire_leading|bms_leading|trainer_leading|owner_leading|breeder_leading)\.html\?*/, '?pid=$2&')
    .replace(/horse\/(horse_photo_list)\.html\??/, 'v1.1/?pid=$1&')
    .replace(/(horse)\/(reviewer_list)\/([0-9a-f]+)\/\??/, 'v1.1/?pid=$1_$2&id=$3&')
    .replace(/(horse)\/(training|race_comment)\/([0-9a-f]+)\/\??/, '?pid=$1_$2&id=$3&')
    .replace(/horse\/horse_news\.html\??/, 'community/?pid=horse_info_next&')
    .replace(/horse\/horse_bbs\.html\??/, '?pid=horse_board&')
    );

    return;
  }

  const id = window.location.href.replace(/^https:\/\/[^\/]+\.netkeiba\.com\/horse\//, '')
  let tr = document.querySelectorAll('.db_prof_table tr');

  for (let i = 0; i < tr.length; i++) {
    const th = tr[i].getElementsByTagName('th');

    if (th[0].innerHTML == '近親馬') {
      remoteFetch('https://db.sp.netkeiba.com/horse/' + id, 'buffer')
      .then(result => {
        convert(result, tr[i]);
      });

      break;
    }
  }
});
