import dotenv from "dotenv";
import express from "express";
import xmlParser from 'xml2json';
import cors from 'cors';

 import fetch from "node-fetch";
 dotenv.config();
 
const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json());

// app.get("/trans", handleGetData);
app.post("/trans", handlePostDataJson);
app.listen(PORT);


async function handleGetData(request, response){
    //  console.clear();
    let uni_hotel_id = request.query.id;
    let ages = request.query.ages;
    let start = request.query.start;
    let end = request.query.end;
    let uni_country_id = request.query.country_id;
    let uni_room_id = request.query.uni_room_id;
    let currency = request.query.currency;
    let citizenship= request.query.citizenship;

    let data = await getFromUni(uni_country_id, uni_hotel_id,uni_room_id,start
        ,end,ages,citizenship,currency,  myHandleData);
       let json = xmlParser.toJson(data);

       const transfers =  JSON.stringify( getTransfersFromJson(json));    
    //    console.log(json);
    response.send(transfers);
}

async function handlePostDataJson(request, response){
  
    try{   
    let param = (request.body);
    let data = await getFromUni(param.uni_country_id, param.uni_hotel_id,param.room_type_id,param.db
        ,param.de,param.ages,param.citizenship,2, myHandleData);
       let json = await xmlParser.toJson(data);  
       const transfers =  await getTransfersFromJson(json);  
    //    console.log(json);
    response.send(transfers);
    }
    catch(e){
        // console.log('error',e.message);
    }
}




function getTransfersFromJson(json){

    // console.clear();
    const data = JSON.parse(json);
    const transArr = data?.envelope?.query_response
    ?.SuccessResponse?.Hotel?.Transfers?.Transfer;

    if(transArr && Array.isArray(transArr)){
        const vehikle0 = transArr[0].Vehicles;
        const vehikle1 = transArr[1].Vehicles;
        let vehiclesArr0 = Object.keys(vehikle0.StartDate).length === 0 
                            ? vehikle0.EndDate.Vehicle : vehikle0.StartDate.Vehicle;
        let  vehiclesArr1 = Object.keys(vehikle1.StartDate).length === 0 
                            ? vehikle1.EndDate.Vehicle : vehikle1.StartDate.Vehicle;

                           if(! Array.isArray(vehiclesArr0) ) 
                           vehiclesArr0 = [vehiclesArr0] ; 

                           if(! Array.isArray(vehiclesArr1) ) 
                           vehiclesArr1 = [vehiclesArr1] ;   

                            // console.log("vehiclesArr0", vehiclesArr0);

                            vehiclesArr0.forEach((item0)=>{
                                let veh1 = vehiclesArr1.find((item1 , index1)=> {
                                  return  Number(item1.Id) === Number(item0.Id);                                    
                                });

                                if(veh1){
                                    item0.Price = Number(item0.Price)  + Number(veh1.Price);
                                    // console.log("item0.Price", item0.Price);
                                }

                                delete item0.RateCode;
                                delete item0.TsRateCodeId;
                                delete item0.RateId;
                                delete item0.Segment;
                                delete item0.TimeStart ;
                                delete item0.TimeEnd;
                                delete item0.MaxPax;

                            });   
                            // console.log("vehiclesArr0",vehiclesArr0);                     
        return  vehiclesArr0;

    }  
    return null;

}


function getRateCodeByCountry(uni_country_id){
    switch (uni_country_id){
        case 228:
            return "4XSC6";
        case 217:
            return "9CN2L";
        case 208:
            return  "8PCNF";//"NZ8FC";
        default:
            return "4XSC6";
    }
}

const getFromUni = async (uni_country_id, uni_hotel_id,room_id,start
    ,end,persons,citzenship)=>{  

        // uni_country_id = 228;
        // uni_hotel_id = 526813;
        // start = '2022-12-28';
        // end = '2023-01-01';
        // persons = '25,25';
        // citzenship = 413;
        // currency = 2;
        // room_id = 90215;


    //  exports.handler = function(param, event, callback) {

    const rate_code = getRateCodeByCountry(uni_country_id);

    // console.log(rate_code);

    const xmlBodyStr = `<?xml version="1.0" encoding="utf-8"?>
    <envelope>
      <header>
        <UnihotelLogin>rates@wiotto.com</UnihotelLogin>
        <UnihotelPassword>d4a525a0d790a961570be97ef9923a34</UnihotelPassword>
        </header>
      <query_request type='GetHotelPrice'>
        <HotelId>${uni_hotel_id}</HotelId>
        <Ages>${persons}</Ages>
        <MealType></MealType>
        <CompanyMealId></CompanyMealId>
        <DateStart>${start}</DateStart>
        <DateEnd>${end}</DateEnd>
        <CurrencyId>2</CurrencyId>
        <RoomId>${room_id}</RoomId>
        <LanguageCode>en</LanguageCode>
        <RateCode>${rate_code}</RateCode>
        <NationalityIds>${citzenship}</NationalityIds>
        <Guests>ST</Guests>
        <WithTransfers>1</WithTransfers>
        <RoomAvailability>all</RoomAvailability>
        <RoomLimit>1</RoomLimit>
        <ExtraBed></ExtraBed>
        <ExcludeRoomIds></ExcludeRoomIds>
        <NettoPrice></NettoPrice>
      </query_request>
    </envelope>`; 
     const xml_out = await getFetchUni(xmlBodyStr);
    
     return xml_out;
    
     };

 function myHandleData(data){
    console.log(data);
    return data;
 } 
 
 const getFetchUni = async (xml_in) => {
    const response = await fetch('https://unihotel.org/api/xml/', {
      method: 'POST',    
      headers: {
          'Content-Type': 'text/xml',
      },
      body:xml_in
    });
    if (!response.ok) throw Error(response.statusText);
    const xml =  response.text(); 
   // console.clear()  ;  
    return xml;
  }
