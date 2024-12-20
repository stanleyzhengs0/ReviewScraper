import puppeteer from "puppeteer";
import fs from 'fs'


const getCafeReview = async (url) => {

  try{
    // Start a Puppeteer session with:
    // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
    // - no default viewport (`defaultViewport: null` - website page will in full width and height)
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();

    // On this new page:
    // - open google maps
    // - wait until the dom content is loaded (HTML is ready)
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.click('button.hh2c6[data-tab-index="1"]')

    const scrollContainer = 'div.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde '     
    const reviewContainer = "div.jftiEf.fontBodyMedium "

    await page.waitForSelector(scrollContainer)
    await page.waitForSelector(reviewContainer)


    // scroll to the end of the page, until all reviews have been opened
    await page.evaluate( async (selector)=>{
      const scrollable = document.querySelector(selector)

      await new Promise((resolve, reject) =>{
        var scrollDelay = 2000
        var totalHeight = 0
        
        var timer = setInterval(async () =>{
          var scrollHeightBefore = scrollable.scrollHeight
          scrollable.scrollBy(0, scrollable.scrollHeight)
          totalHeight += scrollable.scrollHeight

          if(totalHeight >= scrollHeightBefore){
            totalHeight = 0

            await new Promise(resolve => setTimeout(resolve,scrollDelay))

              var scrollHeightAfter = scrollable.scrollHeight

              if(scrollHeightAfter > scrollHeightBefore){
                return
              }else{
                clearInterval(timer)
                resolve()
              }
          }
        }, 200)
      })
    }, scrollContainer)
    


    //click all see more button
    await page.evaluate(()=>{
      const buttons = document.querySelectorAll('button.w8nwRe.kyuRq ')
      buttons.forEach(button => button.click())
        
      });
 
    const review = await page.evaluate((selector, url)=>{

      //parse URL
      const placePath = url.split('/maps/place/')
      const remainingPath = placePath[1].split('/')
      const cafe_name = remainingPath[0].replaceAll('+', " ")
      
      //select the entire scroll container, and convert to array 
      const items = Array.from(
        document.querySelectorAll(selector)
      )

      //iterate through each review container in the scrollable
      return items.map((item)=>{
        let data = {}
        
        try{

          data.cafeName = cafe_name
          data.reviewerName = item.querySelector("button.al6Kxe div.d4r55 ")?.textContent || 'No Name'
          data.Description = item.querySelector("span.wiI7pd")?.textContent || "No Desc."
          data.rating = item.querySelector("div.DU9Pgb > span.kvMYJc").getAttribute("aria-label")[0]
          data.datePosted = item.querySelector("div.DU9Pgb > span.rsqaWe")?.textContent || "NA"

        }catch(error){
          console.log(error)
        }        
        return data
      })
    },reviewContainer, url)

    return review

  }catch(error){
    console.log(error + " Error")
  }finally{
   
  }
};

//converts array of reviews to csv format
function arrayToCsv(arr){
  const header = Object.keys(arr[0])
  const row = arr.map(obj => header.map(header=> JSON.stringify(obj[header])).join(','))
  return [header.join(','), ...row].join('\r\n')
}



const cafes_to_search =[
"https://www.google.com/maps/place/Three+Jewels+Cafe/@40.7263559,-73.9960229,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25984d2115555:0xb698e5fbd183085b!8m2!3d40.726356!4d-73.991152!16s%2Fg%2F11f4lffrbk?entry=ttu",
"https://www.google.com/maps/place/Cafe+La+Fe/@40.7235521,-73.9913858,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25903e3882179:0xf5b85b1bfba1459a!8m2!3d40.7235521!4d-73.9888109!16s%2Fg%2F11vd8p9l8r?entry=ttu",
"https://www.google.com/maps/place/Cafe+Skye/@40.7199522,-73.9874475,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25949ec52e0e3:0xfd0ffe0cd64684c1!8m2!3d40.7199522!4d-73.9848726!16s%2Fg%2F11rcsdbp_9?entry=ttu",
"https://www.google.com/maps/place/Urban+Backyard/@40.7208064,-73.9991764,17z/data=!3m1!4b1!4m6!3m5!1s0x89c2591b920da2bf:0x974c3ae78a7be9e4!8m2!3d40.7208064!4d-73.9966015!16s%2Fg%2F11g0tpkwp1?entry=ttu",
"https://www.google.com/maps/place/Cr%C3%A9me/@40.7158312,-73.992371,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25bd6a8457049:0x3abc9659f51ec3b0!8m2!3d40.7158312!4d-73.9897961!16s%2Fg%2F11fnndz7v8?entry=ttu",
"https://www.google.com/maps/place/Remi+Flower+%26+Coffee/@40.7536386,-73.9741007,16z/data=!3m1!4b1!4m6!3m5!1s0x89c258e28f8e8463:0xcdc00167f3e02745!8m2!3d40.7536387!4d-73.9692298!16s%2Fg%2F11gd1vg755?entry=ttu"
]

var cafe_reviews = []

for(var i = 0; i < cafes_to_search.length; i++){
    //array of objects, where each object holds review props
    let review = (await getCafeReview(cafes_to_search[i]))
    cafe_reviews = [...cafe_reviews, ...review]

}




const csv = arrayToCsv(cafe_reviews)
fs.writeFileSync('output.csv', csv, 'utf8');




