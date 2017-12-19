# FrontEndMasters Downloader

Simple and fast script for downloading hard copy of [FrontendMasters](frontendmasters.com) (highly recommended if you want to improve your JS skills), this tool is using the headless chrome API Puppeteer and this is my first try using it.

## features

 * Also save transcripts (subtitles) if available
 * Choose between available video quality (360/720/1080) 
 * Can handle maximum rate-limit (waits for limit clears)

## how to use
after you clone/download, install dependencies 
```bash
npm install
```
run script with course name from url (frontendmasters.com/course/course-name/)
```bash
node femdl.js -u 'my@email.com' -p 'mypw' -r 1080 -c 'course-name'
```

## fair use
Before using this script please read and follow frontendmasters [terms of service](https://frontendmasters.com/assets/MasterServicesAgreement.pdf) and don't violate any of their copyright.

