import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { response } from 'express';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) { }
  public logger = new Logger(AppService.name);

  public async compareInvoiceAndPo(): Promise<void> {

    const axios = this.httpService.axiosRef;

    this.logger.log("getting invoices from the API...");
    const invoices = await axios.get('https://dh7aht0kba.execute-api.ap-southeast-2.amazonaws.com/dev/invoices');
    let jsonInvoices = invoices.data;

    Logger.log("iterating over the array of invoices...");
    jsonInvoices.body.forEach(async function (invoice) {

      Logger.log("getting the PO_NUMBER from the invoice...");
      let po_number = invoice.Fields.find(i => i.FieldName == "PO_NUMBER")
      try{  
        
        //check if there is an order
        if (!po_number){
          throw new Error("ERRORMESAGE_PURCHARSE_ORDER_NOT_FOUND")
        }
          Logger.log("PO_NUMBER: " + po_number.Item);
          Logger.log("getting the related Po from the API by PO_NUMBER...");
          const purchase_order= await axios.get('https://dh7aht0kba.execute-api.ap-southeast-2.amazonaws.com/dev/purchase-orders/' + po_number.Item)
          
          //List of pruducts (lines/rows) in the invoice
          let listOfItems = invoice.Fields.find(items => items.FieldName == "ITEMS").Item.Row
          
          //Iterating list of products
          listOfItems.forEach(async function (row) {
          
            let codeProductInvoice = row.ColumnValue[0].Item
            let jsonPO = purchase_order.data[0]

            Logger.log("Comparing product with code: " + codeProductInvoice);
            let poProductFound = jsonPO.POPurchaseOrder.LineItems.find(codeProductPO =>
            codeProductPO.StockItem == codeProductInvoice ||
            codeProductPO.SupplierPartNo == codeProductInvoice)
            try
            {
              if (!poProductFound) {
                throw new Error("ERRORMESAGE_CODE_MISSMATCH")
              }
              Logger.log("Items code " + codeProductInvoice + " match!");
              Logger.log("Comparing quantities...");

              let quantityProductInvoice = parseInt(row.ColumnValue[4].Item);

              Logger.log("PO product quantity: " + poProductFound.Quantity);
              Logger.log("Invoice product quantity: " + quantityProductInvoice);

              if (poProductFound.Quantity !== quantityProductInvoice) {
                throw new Error("ERRORMESAGE_QUANTITIES_MISSMATCH")
              }
              else {
                Logger.log("Quantities match too!\n");
              }
            } catch(error){
                ErrorHandler(error)
            }
          })
      }catch(error){
        ErrorHandler(error)
      }
    })
  }
}

function ErrorHandler(error: any) {
  Logger.log("Error in compareInvoiceAndPo: "+ error.message);
}

