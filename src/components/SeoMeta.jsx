import { useEffect } from 'react'

const DEFAULT_SITE_NAME = '放射師國考刷題庫'
const DEFAULT_BASE_URL = 'https://radiographer-exam-bank.pages.dev'

function upsertMeta({ selector, attribute, key, content }) {
  if (typeof document === 'undefined' || !content) {
    return
  }

  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertLink({ rel, href }) {
  if (typeof document === 'undefined' || !href) {
    return
  }

  let element = document.head.querySelector(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function upsertJsonLd(jsonLd) {
  if (typeof document === 'undefined' || !jsonLd) {
    return
  }

  const scriptId = 'app-json-ld'
  let element = document.getElementById(scriptId)

  if (!element) {
    element = document.createElement('script')
    element.id = scriptId
    element.type = 'application/ld+json'
    document.head.appendChild(element)
  }

  element.textContent = JSON.stringify(jsonLd)
}

function SeoMeta({
  title,
  description,
  canonicalPath = '/',
  robots = 'index,follow',
  siteName = DEFAULT_SITE_NAME,
  baseUrl = DEFAULT_BASE_URL,
  jsonLd,
}) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const canonicalUrl = new URL(canonicalPath, baseUrl).toString()
    document.title = title || DEFAULT_SITE_NAME

    upsertMeta({
      selector: 'meta[name="description"]',
      attribute: 'name',
      key: 'description',
      content: description,
    })
    upsertMeta({
      selector: 'meta[name="twitter:title"]',
      attribute: 'name',
      key: 'twitter:title',
      content: title,
    })
    upsertMeta({
      selector: 'meta[name="twitter:description"]',
      attribute: 'name',
      key: 'twitter:description',
      content: description,
    })
    upsertMeta({
      selector: 'meta[property="og:title"]',
      attribute: 'property',
      key: 'og:title',
      content: title,
    })
    upsertMeta({
      selector: 'meta[property="og:description"]',
      attribute: 'property',
      key: 'og:description',
      content: description,
    })
    upsertMeta({
      selector: 'meta[property="og:url"]',
      attribute: 'property',
      key: 'og:url',
      content: canonicalUrl,
    })
    upsertMeta({
      selector: 'meta[property="og:site_name"]',
      attribute: 'property',
      key: 'og:site_name',
      content: siteName,
    })
    upsertMeta({
      selector: 'meta[name="robots"]',
      attribute: 'name',
      key: 'robots',
      content: robots,
    })

    upsertLink({ rel: 'canonical', href: canonicalUrl })

    if (jsonLd) {
      upsertJsonLd(jsonLd)
    }
  }, [baseUrl, canonicalPath, description, jsonLd, robots, siteName, title])

  return null
}

export default SeoMeta
