import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { response } from 'express';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}
  public logger = new Logger(AppService.name);

  public compareInvoiceAndPo(): void {

    const axios = this.httpService.axiosRef;
    
    this.logger.log("getting invoices from the API...");
    let invoices = axios.get(' https://dh7aht0kba.execute-api.ap-southeast-2.amazonaws.com/dev/invoices')
     .then((response)=>
     {
      let jsonInvoices = response.data

      Logger.log("iterating array of invoices...");

      jsonInvoices.body.forEach(function (invoice)
      {

        Logger.log("getting the PO_NUMBER from PO...");

        let po_number = invoice.Fields.find(i=> i.FieldName =="PO_NUMBER")

        if (po_number!= null){
          
          Logger.log("PO_NUMBER: " + po_number.Item);

          axios.get('https://dh7aht0kba.execute-api.ap-southeast-2.amazonaws.com/dev/purchase-orders/'+po_number.Item)
          .then((response)=>
          {
            let jsonPO = response.data[0]
            jsonPO.POPurchaseOrder.LineItems.forEach((function (item){

              Logger.log("StockItem: " + item.StockItem + "| SupplierPartNo: " + item.SupplierPartNo);
            }))

          });

        }
        else{
          Logger.log("PO_Number not found");
        }
      });      
    });

    }
  }

