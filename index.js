import puppeteer from "puppeteer";
import fs from 'fs'


const openBrowser = async (url) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "domcontentloaded",

  })

  return page
}

const createReviewCollection =() => {

}

const createCafeCollection = async (page) => {
    try{
      let cafeCollection = {}

      cafeCollection.cafeName = await page.$eval('div.lMbq3e > div > h1.DUwDvf.lfPIob ', element => element.textContent.trim());
      cafeCollection.location = await page.$eval('button.CsEnBe[data-tooltip="Copy address"] > div.AeaXub > div.rogA2c', element => element.textContent.trim()|| "No Address");
      cafeCollection.phoneNumber = await page.$eval('button.CsEnBe[data-tooltip="Copy phone number"] > div.AeaXub > div.rogA2c', element => element.textContent.trim() || "No Number");
      cafeCollection.website = await page.$eval('a.CsEnBe[data-tooltip="Open website"] > div.AeaXub > div.rogA2c', element => element.textContent.trim() || "No Website");
   
     //  console.log(cafeName, "\n", location, "\n" ,phoneNumber,  "\n" , website)
 
      return cafeCollection

    }catch(error){
      console.log("Error in create Cafe Collection: ", error)
    }
}

const getCafeReview = async (url, page) => {

  try{

    // navigate to review section
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
  }
};



//converts array of reviews to csv format
 function arrayToCsv(arr){
  const header = Object.keys(arr[0])
  const row = arr.map(obj => header.map(header=> JSON.stringify(obj[header])).join(','))
  return [header.join(','), ...row].join('\r\n')
}



// const cafes_to_search =[
// "https://www.google.com/maps/place/Three+Jewels+Cafe/@40.7263559,-73.9960229,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25984d2115555:0xb698e5fbd183085b!8m2!3d40.726356!4d-73.991152!16s%2Fg%2F11f4lffrbk?entry=ttu",
// "https://www.google.com/maps/place/Cafe+La+Fe/@40.7235521,-73.9913858,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25903e3882179:0xf5b85b1bfba1459a!8m2!3d40.7235521!4d-73.9888109!16s%2Fg%2F11vd8p9l8r?entry=ttu",
// "https://www.google.com/maps/place/Cafe+Skye/@40.7199522,-73.9874475,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25949ec52e0e3:0xfd0ffe0cd64684c1!8m2!3d40.7199522!4d-73.9848726!16s%2Fg%2F11rcsdbp_9?entry=ttu",
// "https://www.google.com/maps/place/Urban+Backyard/@40.7208064,-73.9991764,17z/data=!3m1!4b1!4m6!3m5!1s0x89c2591b920da2bf:0x974c3ae78a7be9e4!8m2!3d40.7208064!4d-73.9966015!16s%2Fg%2F11g0tpkwp1?entry=ttu",
// "https://www.google.com/maps/place/Cr%C3%A9me/@40.7158312,-73.992371,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25bd6a8457049:0x3abc9659f51ec3b0!8m2!3d40.7158312!4d-73.9897961!16s%2Fg%2F11fnndz7v8?entry=ttu",
// "https://www.google.com/maps/place/Remi+Flower+%26+Coffee/@40.7536386,-73.9741007,16z/data=!3m1!4b1!4m6!3m5!1s0x89c258e28f8e8463:0xcdc00167f3e02745!8m2!3d40.7536387!4d-73.9692298!16s%2Fg%2F11gd1vg755?entry=ttu"
// ]

// const cafes_to_search =[
//  "https://www.google.com/maps/place/Plowshares+Coffee+Bloomingdale/@40.8001111,-73.9703416,16z/data=!3m1!4b1!4m6!3m5!1s0x89c2f622304f77ff:0xff6ca2fd1f1d8bb8!8m2!3d40.8001111!4d-73.9677667!16s%2Fg%2F1q65g1msr?entry=ttu&g_ep=EgoyMDI1MDEyMC4wIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/Variety+Coffee+Roasters/@40.7401898,-74.0115869,13.5z/data=!4m6!3m5!1s0x89c259a533a7d2e3:0x37d08e1c0464b202!8m2!3d40.745199!4d-73.9945617!16s%2Fg%2F11c6cd32m5?entry=ttu&g_ep=EgoyMDI1MDEyMC4wIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/St+Kilda+Coffee/@40.74953,-74.0037178,13.75z/data=!4m6!3m5!1s0x89c2585398cb1ecd:0x1c444f8aa8477495!8m2!3d40.7590238!4d-73.9902597!16s%2Fg%2F11c2091lqr?entry=ttu&g_ep=EgoyMDI1MDEyMC4wIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/Hi-Collar/@40.7295831,-73.9904073,17z/data=!3m1!4b1!4m6!3m5!1s0x89c2599c4b4c2267:0xcfea0fb3f579b4e8!8m2!3d40.7295831!4d-73.9878324!16s%2Fg%2F12lk79rmt?entry=ttu&g_ep=EgoyMDI1MDEyMC4wIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/787+Coffee/@40.7165872,-74.0048064,16z/data=!3m2!4b1!5s0x89c25a2202036591:0x5616f29d1236fb5c!4m6!3m5!1s0x89c25b377fd2aa47:0x828f2d1d16df18ab!8m2!3d40.7165872!4d-74.0048064!16s%2Fg%2F11sl700j__?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/Old+Fashion+Caf%C3%A9/@40.7257358,-74.0043324,17z/data=!3m1!4b1!4m6!3m5!1s0x89c2591c46252bc1:0x7358835c880fb904!8m2!3d40.7257358!4d-74.0017575!16s%2Fg%2F11t9nypqmg?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/The+Lazy+Llama+Coffee+Bar/@40.7234943,-73.9912272,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25983814d41d5:0x979ac7d9cd5f7870!8m2!3d40.7234943!4d-73.9886523!16s%2Fg%2F11cjpchz0g?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/Dreamers+Coffee+House/@40.712685,-73.9978133,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25ba999d4b253:0xb8a44ce014cfc130!8m2!3d40.712685!4d-73.9952384!16s%2Fg%2F11j0bpj1sq?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/La+Cabra/@40.72431,-74.062118,13z/data=!4m6!3m5!1s0x89c2590b5700aed3:0x143482a9c81bf22b!8m2!3d40.72431!4d-73.9962!16s%2Fg%2F11v0c2bcyg?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/Horus+Cafe+on+A/@40.7268766,-74.0018174,15z/data=!4m6!3m5!1s0x89c2597633148173:0xc81ed1096aa374b7!8m2!3d40.7279062!4d-73.9819867!16s%2Fg%2F1tf7t166?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/Cafe+Yaya/@40.7267031,-74.0013986,17z/data=!3m1!4b1!4m6!3m5!1s0x89c259e8213d6613:0x61dc3dfb21ef51b9!8m2!3d40.7267031!4d-74.0013986!16s%2Fg%2F11y9mz6khy?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D",
//  "https://www.google.com/maps/place/Brewlita/@40.7225831,-73.9962714,17z/data=!3m1!4b1!4m6!3m5!1s0x89c259f3c38fe9f9:0x9396732a2eb28cb!8m2!3d40.7225831!4d-73.9962714!16s%2Fg%2F11rnh_b8pg?entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D",
//  "",
//  "",
//  "",
//  "",
//  "",
//  "",
//  "",
 
// ]



//Testing List
const cafes_to_search =[
  "https://www.google.com/maps/place/The+Oasis+Cafe/@40.7292226,-73.9809392,17z/data=!3m1!4b1!4m6!3m5!1s0x89c259005b015dc5:0x1d0f838119e1c6c1!8m2!3d40.7292226!4d-73.9809392!16s%2Fg%2F11y5t9dnxx?entry=ttu&g_ep=EgoyMDI1MDEyOC4wIKXMDSoASAFQAw%3D%3D"
  // "https://www.google.com/maps/place/La+Fleur+Caf%C3%A9/@40.7276867,-73.9856926,17z/data=!3m1!4b1!4m6!3m5!1s0x89c259863128bfdd:0x9af14ba56227dadd!8m2!3d40.7276867!4d-73.9831177!16s%2Fg%2F11qbd_79mm?entry=ttu&g_ep=EgoyMDI1MDEyOC4wIKXMDSoASAFQAw%3D%3D"
]





async function main (){

  let cafe_reviews = []
  let cafe_details = []

  for(var i = 0; i < cafes_to_search.length; i++){

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();

    await page.goto(cafes_to_search[i], {
      waitUntil: "domcontentloaded",

    })

  
    let cafeCollection =  await createCafeCollection(page)
    cafe_details.push(cafeCollection)

    // console.log(cafeCollection)

    //array of objects, where each object holds review props
    let review = await (getCafeReview(cafes_to_search[i], page))
    cafe_reviews = [...cafe_reviews, ...review]
    
    // console.log(review)

    
    
  }


 

  //WRITE TO CAFE COLLECTION
  const cafeCollection = arrayToCsv(cafe_details)
  fs.writeFileSync('cafeCollection.csv', cafeCollection, 'utf8');

  //WRITE TO REVIEW COLLECTION 
  const reviewCollection = arrayToCsv(cafe_reviews)
  fs.writeFileSync('reviewCollection.csv', reviewCollection, 'utf8');
  
}



main()



 



