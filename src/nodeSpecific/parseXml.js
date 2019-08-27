import { DOMParser } from 'xmldom';

export default function parseXml(xmlStr) {
  return (new DOMParser()).parseFromString(xmlStr, 'text/xml');
}
