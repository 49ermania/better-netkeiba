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
    const codeUnits = new Uint16Array(th[0].innerHTML.length);

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
  if (window.location.href.match('https:\/\/[^\/]+\.sp\.netkeiba\.com')) {
    window.location.replace(window.location.href.replace(/\.sp/, ''));
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
