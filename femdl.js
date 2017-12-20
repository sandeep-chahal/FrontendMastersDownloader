'use strict'
const puppeteer = require('puppeteer')
const commandLineArgs = require('command-line-args')
const download = require('download')
const sleep = require('system-sleep')
const fs = require('fs')

const optionDefinitions = [
  { name: 'username', alias: 'u', type: String },
  { name: 'password', alias: 'p', type: String },
  { name: 'course', alias: 'c', type: String },
  { name: 'res', alias: 'r', type: Number }
]
const {username, password, course, res} = commandLineArgs(optionDefinitions)

async function run() {
  const api_url = 'https://api.frontendmasters.com/v1/kabuki'
  const browser = await puppeteer.launch({ headless: true })
  const page = await init(browser)
  await login(page)
  let data = await extractData(page, api_url, course)
  if (data['code'] !== 404) {
    await dlCourse(page, data, api_url, res)
  }
  else {
    console.log('Course not found.')
  }
  browser.close()
}

async function dlCourse(page, data, api_url, res) {
  const len = data['lessonData'].length
  dlResources(data)
  dlTranscripts(data, api_url, len)
  await dlVideos(page, data, api_url, len)
}

async function dlVideos(page, data, api_url, len) {
  const course = data['slug']
  for (let lesson of data['lessonData']) {
    const { index, slug } = lesson
    let json_video = await extractJsonVideo(page, api_url, lesson, res)
    dlfile(json_video['url'], course, index, len, 'webm', slug)
  }
}

async function dlTranscripts(data, api_url, len) {
  const course = data['slug']
  if (data['hasTranscript']) {
    for (let lesson of data['lessonData']) {
      const { index, statsId, slug } = lesson
      const transcript_url = `${api_url}/transcripts/${statsId}.vtt`
      dlfile(transcript_url, course, index, len, 'vtt', slug)
      sleep(0.2*1000);
    }
  }
}

async function dlResources(data) {
  const { slug } = data
  const len = data['resources'].length
  for (let [index, resource] of data['resources'].entries()) {
    const { label, url } = resource
    console.log(label)
    const ext = url.split('.').slice(-1)
    dlfile(url, slug, index, len, ext, label)
  }
}

function dlfile(url, path, idx, len, ext, name) {
  download(url, `./${path}/`, { filename : `${idx}.${name}.${ext}`})
    .then(() => console.log(`downloaded (${idx + 1}/${len}): ${name}.${ext}`))
    .catch( (err) => console.log(`error downloading ${name}.${ext}: ${err}`))
}

async function extractJsonVideo(page, api_url, lesson, res) {
  const { sourceBase } = lesson
  const video_url = `${sourceBase}/source?r=${res}&f=webm`
  await page.goto(video_url);
  let json_video = await page.evaluate(() => {
    return JSON.parse(document.documentElement.innerText)
  })
  if (json_video['url'] == undefined) {
    sleep(1*60*1000);
    json_video = extractJsonVideo(page, api_url, lesson, res)
  }
  return json_video
}

async function extractData(page, api_url, course) {
  const url = `${api_url}/courses/${course}`
  await page.goto(url)
  const json = await page.evaluate(() => document.documentElement.innerText)
  return JSON.parse(json)
}

async function init(browser) {
  const headers = {
    'authority' : 'api.frontendmasters.com',
    'ACcept' : 'application/json, text/*',
    'accept-encoding' : 'gzip, deflate, br',
    'accept-language' : 'en-US,en;q=0.9,he;q=0.8',
    'dnt' : '1',
    'origin' : 'https://frontendmasters.com',
    'referer' : 'https://frontendmasters.com/',
    'user-agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
  }
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders(headers)
  return page
}

async function login(page) {
  const USERNAME_SELECTOR = '#username'
  const PASSWORD_SELECTOR = '#password'
  const BUTTON_SELECTOR = '#loginForm > button'

  const LOGIN_URL = 'https://frontendmasters.com/login/'
  await page.goto(LOGIN_URL)
  await page.click(USERNAME_SELECTOR)
  await page.keyboard.type(username)
  await page.click(PASSWORD_SELECTOR)
  await page.keyboard.type(password)
  await page.click(BUTTON_SELECTOR)
  await page.waitFor(3000)
}
run()
