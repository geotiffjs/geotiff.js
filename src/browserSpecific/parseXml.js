export default function parseXml(xmlStr) {
  if (typeof window.DOMParser !== 'undefined') {
    return (new window.DOMParser()).parseFromString(xmlStr, 'text/xml');
  } else if (typeof window.ActiveXObject !== 'undefined' && new window.ActiveXObject('Microsoft.XMLDOM')) {
    return function (xmlStr) {
      const xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
      xmlDoc.async = 'false';
      xmlDoc.loadXML(xmlStr);
      return xmlDoc;
    };
  }
}
