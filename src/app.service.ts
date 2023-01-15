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

        Logger.log("getting the PO_NUMBER from the invoice...");

        let po_number = invoice.Fields.find(i=> i.FieldName =="PO_NUMBER")

        //check if there is an order
        if (po_number!= null){
          
          Logger.log("PO_NUMBER: " + po_number.Item);
          Logger.log("getting the related Po from the API by PO_NUMBER...");

          axios.get('https://dh7aht0kba.execute-api.ap-southeast-2.amazonaws.com/dev/purchase-orders/'+po_number.Item)
          .then((response)=>
          {

            //List of pruducts (lines/rows) in the invoice
            let listOfItems = invoice.Fields.find(items=> items.FieldName =="ITEMS").Item.Row

            //Iterating list of products
            listOfItems.forEach((function (row){

              let codeProductInvoice =row.ColumnValue[0].Item
              let jsonPO = response.data[0]

              Logger.log("Comparing product with code: " + codeProductInvoice);

                let POproductFound = jsonPO.POPurchaseOrder.LineItems.find(codeProductPO=> 
                codeProductPO.StockItem == codeProductInvoice ||
                codeProductPO.SupplierPartNo == codeProductInvoice
                )
              if(POproductFound!=null)
              {
                Logger.log("Items code "+ codeProductInvoice+" match!");
                Logger.log("Comparing quantities...");

                let quantityProductInvoice = row.ColumnValue[4].Item
                Logger.log("PO product quantity: " + POproductFound.Quantity);
                Logger.log("Invoice product quantity: " + parseInt(quantityProductInvoice));
                if(POproductFound.Quantity == quantityProductInvoice)
                {
                  Logger.log("Quantities match too!");
                }
                else
                {
                  Logger.log("Quantities missmatch!");
                }

              }
              else
              {
                Logger.log("Items code "+ codeProductInvoice+" missmatch!");
              }
                
                            
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

