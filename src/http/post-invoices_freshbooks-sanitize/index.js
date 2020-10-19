// learn more about HTTP functions here: https://arc.codes/primitives/http
let begin = require('@architect/functions')

/**
 * Process form data from Zapier that represents an invoice created in Freshbooks Clasic
 * and formats it for Quickbooks
 * @param {Architect Request} req 
 */
exports.handler = async function http (req) {
  let inputData = begin.http.helpers.bodyParser(req);

  // The line items will be a comma-separated list of numbers
  // We need to create an array so that we can then sum the numbers up
  // using a reduce
  let invoiceLineAmounts = inputData.invoiceLineAmountsAsString.split(',');

  // The subtotal of all of the line item totals
  let invoiceSubTotal = Number(invoiceLineAmounts.reduce(sumLineAmounts)).toFixed(2);

  // The total amount disounted on the invoice
  let invoiceDiscountTotal = Number(invoiceSubTotal * (Number(inputData.invoiceDiscountPercentage) / 100)).toFixed(2);

  // The total of the invoice that is susceptible to taxes
  // NOTE:  taxes are applied after discounts
  let taxableTotal = Number(invoiceSubTotal - invoiceDiscountTotal).toFixed(2);

  // The total amount that is taxed
  // Sometimes this will be 0 if no line items are taxable
  let taxAmount = Number(inputData.invoiceAmount - taxableTotal).toFixed(2);

  // Convert all invoice line quantities to decimal format to make it play nicely with
  // Quickbooks, since Quickbooks does not allow integer quantities
  // e.g. (a quantity of 1 has to be represented as 1.00)
  let invoiceLineQuantities = inputData.invoiceLineQuantitiesAsString.split(',');
  let invoiceLineQuantitiesAsDecimals = invoiceLineQuantities.map(convertToDecimal);

  // By combining tax 1 and tax 2 percentages, we can more easily detect if a line item
  // has any tax applied at all, as the combined percentage would be greater than 0%
  let invoiceLineTax1Percentages = inputData.invoiceLineTax1PercentagesAsString.split(',');
  let invoiceLineTax2Percentages = inputData.invoiceLineTax2PercentagesAsString.split(',');
  let invoiceLineCombinedTaxPercentages = invoiceLineTax1Percentages.map(function (num, idx){
    return Number(num) + Number(invoiceLineTax2Percentages[idx]);
  });

  // In Quickbooks, a line item that has the status of 'TAX' indicates it is taxable.
  let invoiceLineTaxableStatus = invoiceLineCombinedTaxPercentages.map(convertToQuickbooksTaxableStatus);

  // This will determine which Quickbooks tax code to use.
  // Since ethode is in an origin-based sales tax state, this is pretty
  // straightforward:  if the invoice has any taxable invoices lines, then
  // we use one code.  This will either be 0 for no taxes, or the numeric
  // Quickbooks code that represents Ohio + Medina sales tax.
  let quickbooksTaxCode = determineQuickbooksTaxCode(invoiceLineTaxableStatus);

  // Converts a number like 1 into 1.00
  function convertToDecimal(number) {
    return Number(number).toFixed(2); 
  }

  // The Quickbooks tax code field is on the line item level
  // If a line item is considered taxable, meaning the item has a 
  // tax percentage greater than 0, then the 'TAX' code should be used
  // to let Quickbooks know the line item should have tax applied to it.
  function convertToQuickbooksTaxableStatus(taxPercentage) {
    if ( Number(taxPercentage) > 0 ) {
      return 'TAX'; 
    } else {
      return 'NON'; 
    }
  }

  function determineQuickbooksTaxCode(invoiceLineTaxableStatus) {
    if (invoiceLineTaxableStatus.includes('TAX')) {
      return 16; // 16 is the numeric id for Ohio + Medina sales tax in Quickbooks 
    } else {
      return 0;
    }
  }

  // Increments the total by the given amount
  function sumLineAmounts(total, amount) {
    return Number(total) + Number(amount);
  }

  output = [{
    invoiceLineAmountsAsString: inputData.invoiceLineAmountsAsString,
    invoiceLineAmounts: invoiceLineAmounts, 
    invoiceSubTotal: invoiceSubTotal,
    invoiceDiscountTotal: invoiceDiscountTotal,
    taxableTotal: taxableTotal,
    taxAmount: taxAmount,
    invoiceLineQuantities: invoiceLineQuantities,
    invoiceLineQuantitiesAsDecimals: invoiceLineQuantitiesAsDecimals,
    invoiceLineTax1Percentages: invoiceLineTax1Percentages,
    invoiceLineTax2Percentages: invoiceLineTax2Percentages,
    invoiceLineCombinedTaxPercentages: invoiceLineCombinedTaxPercentages,
    invoiceLineTaxableStatus: invoiceLineTaxableStatus,
    quickbooksTaxCode: quickbooksTaxCode
  }];

  // Send response back
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf8',
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
    },
    body: JSON.stringify(output)
  }
}