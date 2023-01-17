import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { response } from 'express';
import { ERROR_MESSAGE_ENUM } from './enums/error.enum';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}
  public logger = new Logger(AppService.name);

  public async compareInvoiceAndPo(): Promise<void> {
    const axios = this.httpService.axiosRef;

    this.logger.log('getting invoices from the API...');
    const invoices = await axios.get(
      'https://dh7aht0kba.execute-api.ap-southeast-2.amazonaws.com/dev/invoices',
    );
    const jsonInvoices = invoices.data;

    this.logger.log('iterating over the array of invoices...');
    jsonInvoices.body.forEach(async function (invoice) {
      this.logger.log('getting the PO_NUMBER from the invoice...');
      const poNumber = invoice.Fields.find((i) => i.FieldName == 'PO_NUMBER');
      try {
        //check if there is an order
        if (!poNumber) {
          throw new Error(ERROR_MESSAGE_ENUM.ERRORMESAGE_PURCHARSE_ORDER_NOT_FOUND);
        }
        this.logger.log('PO_NUMBER: ' + poNumber.Item);
        this.logger.log('getting the related Po from the API by PO_NUMBER...');
        const purchase_order = await axios.get(
          'https://dh7aht0kba.execute-api.ap-southeast-2.amazonaws.com/dev/purchase-orders/' +
            poNumber.Item,
        );

        //List of pruducts (lines/rows) in the invoice
        const listOfItems = invoice.Fields.find((items) => items.FieldName == 'ITEMS').Item.Row;

        //Iterating list of products
        listOfItems.forEach(async function (row) {
          const codeProductInvoice = row.ColumnValue[0].Item;
          const jsonPO = purchase_order.data[0];

          this.logger.log('Comparing product with code: ' + codeProductInvoice);
          const poProductFound = jsonPO.POPurchaseOrder.LineItems.find(
            (codeProductPO) =>
              codeProductPO.StockItem == codeProductInvoice ||
              codeProductPO.SupplierPartNo == codeProductInvoice,
          );
          try {
            if (!poProductFound) {
              throw new Error(ERROR_MESSAGE_ENUM.ERRORMESAGE_CODE_MISSMATCH);
            }
            this.logger.log('Items code ' + codeProductInvoice + ' match!');
            this.logger.log('Comparing quantities...');

            const quantityProductInvoice = parseInt(row.ColumnValue[4].Item);

            this.logger.log('PO product quantity: ' + poProductFound.Quantity);
            this.logger.log('Invoice product quantity: ' + quantityProductInvoice);

            if (poProductFound.Quantity !== quantityProductInvoice) {
              throw new Error(ERROR_MESSAGE_ENUM.ERRORMESAGE_QUANTITIES_MISSMATCH);
            } else {
              this.logger.log('Quantities match too!\n');
            }
          } catch (error) {
            ErrorHandler(error);
          }
        });
      } catch (error) {
        ErrorHandler(error);
      }
    });
  }
}

function ErrorHandler(error: any) {
  this.logger.log('Error in compareInvoiceAndPo: ' + error.message);
}
