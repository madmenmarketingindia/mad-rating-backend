// export const generateSalarySlipHTML = ({
//   employee,
//   payroll,
//   avgRating,
//   baseSalary,
//   incentive,
//   incentivePct,
//   netPay,
//   month,
//   year,
// }) => `
// <html>
// <head>
//   <style>
//     body { font-family: Arial, sans-serif; margin: 40px; }
//     h1, h2 { text-align: center; }
//     table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//     th, td { border: 1px solid #ddd; padding: 8px; }
//     th { background-color: #f4f4f4; }
//     .right { text-align: right; }
//   </style>
// </head>
// <body>
//   <h1>MAD MEN MARKETING OPC PRIVATE LIMITED</h1>
//   <h2>SALARY SLIP</h2>
//   <p>Employee Name: ${employee.firstName} ${employee.lastName}</p>
//   <p>Designation: ${employee.officialDetails?.designation || "N/A"}</p>
//   <p>Date of Joining: ${employee.officialDetails?.joiningDate || "N/A"}</p>
//   <p>Month & Year: ${month}-${year}</p>

//   <h3>Earnings</h3>
//   <table>
//     <tr><th>Description</th><th class="right">Amount (₹)</th></tr>
//     <tr><td>Basic Salary</td><td class="right">${baseSalary.toFixed(
//       2
//     )}</td></tr>
//     <tr><td>Incentive (${incentivePct.toFixed(
//       2
//     )}%)</td><td class="right">${incentive.toFixed(2)}</td></tr>
//     <tr><td>Reimbursement</td><td class="right">${
//       payroll.reimbursement || 0
//     }</td></tr>
//   </table>

//   <h3>Deductions</h3>
//   <table>
//     <tr><th>Description</th><th class="right">Amount (₹)</th></tr>
//     <tr><td>Leaves Deduction</td><td class="right">${
//       payroll.deductions || 0
//     }</td></tr>
//     <tr><td>Other Adjustments</td><td class="right">${
//       payroll.leaveAdjusted || 0
//     }</td></tr>
//   </table>

//   <h2 class="right">NET SALARY: ₹ ${netPay.toFixed(2)}</h2>

//   <p>Mode of Payment: ${payroll.modeOfPayment || "NEFT"}</p>
//   <p>Bank: ${employee.bankDetails?.bankName || "N/A"}</p>
//   <p>Dated: ${new Date().toLocaleDateString()}</p>

//   <p style="text-align: right; margin-top: 50px;">Authorized Signatory</p>
// </body>
// </html>
// `;

// utils/generateSalarySlipHTML.js
export const generateSalarySlipHTML = ({
  employee,
  salary,
  rating,
  month,
  year,
}) => {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr || "N/A";
    return d.toLocaleDateString("en-GB");
  };

  const formatMonthYear = (m, y) => {
    const date = new Date(`${y}-${m}-01`);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const capitalizeWords = (str = "") =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const TotalIncentive =
    (salary.incentiveAmount ?? 0) + (salary.teamIncentive ?? 0);

  const totalAddition =
    (salary.baseSalary ?? 0) +
    (salary.incentiveAmount ?? 0) +
    (salary.teamIncentive ?? 0) +
    (salary.reimbursement ?? 0);

  const totalDeduction = (salary.leaveAdjusted ?? 0) + (salary.deductions ?? 0);

  return `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #000; }
    .slip { border: 2px solid #000; padding: 20px; }
    h1 { text-align: center; font-size: 18px; margin: 0; font-weight: bold; }
    .company { text-align: center; font-size: 12px; margin-bottom: 10px; }
    h2 { text-align: center; margin: 10px 0; text-decoration: underline; font-size: 16px; }
    .details { font-size: 13px; margin-top: 15px; }
    .details p { margin: 3px 0; }
    .inline { display: flex; justify-content: space-between; width: 100%; }
    .tables { display: flex; justify-content: space-between; margin-top: 20px; gap: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #000; padding: 6px 8px; }
    th { background: #f4f4f4; }
    .right { text-align: right; }
    .net-salary { margin-top: 25px; text-align: right; font-size: 15px; font-weight: bold; }
    .footer { margin-top: 25px; font-size: 12px; }
    .footer p { margin: 3px 0; }
    .bottom { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
  </style>
</head>
<body>
  <div class="slip">
    <h1>MAD MEN MARKETING OPC PRIVATE LIMITED</h1>
    <div class="company">
      N-29, RIVIERA APARTMENTS, 45 MALL ROAD, CIVIL LINES, NEW DELHI-110054
    </div>
    <h2>SALARY SLIP</h2>

    <div class="details">
      <p><b>Employee Name:</b> ${capitalizeWords(
        `${employee.firstName || ""} ${employee.lastName || ""}`
      )}</p>
      <div class="inline">
        <span><b>Designation:</b> ${capitalizeWords(
          employee?.officialDetails?.designation || "N/A"
        )}</span>
        <span><b>Date of Joining:</b> ${formatDate(
          employee?.officialDetails?.joiningDate
        )}</span>
      </div>
      <p><b>Month & Year:</b> ${formatMonthYear(month, year)}</p>
    </div>

    <div class="tables">
      <!-- Earnings -->
      <table>
        <tr><th>Earnings</th><th class="right">Amount (₹)</th></tr>
        <tr><td>Basic Salary</td><td class="right">${(
          salary.basicSalary ?? 0
        ).toLocaleString()}</td></tr>
        <tr><td>HRA</td><td class="right">${(
          salary.hra ?? 0
        ).toLocaleString()}</td></tr>

          <tr><td>Conveyance Allowance</td><td class="right">${(
            salary.conveyanceAllowance ?? 0
          ).toLocaleString()}</td></tr>

           <tr><td>Medical Allowance </td><td class="right">${(
             salary.medicalAllowance ?? 0
           ).toLocaleString()}</td></tr>

            <tr><td>Special Allowance </td><td class="right">-</td></tr>


            <tr><td>LTA </td><td class="right">-</td></tr>

            <tr><td>ARREARS </td><td class="right">-</td></tr>



        <tr><td>Incentive</td>
            <td class="right">${(
              TotalIncentive ?? 0
            ).toLocaleString()}</td></tr>
        <tr><td>Reimbursement</td>
            <td class="right">${(
              salary.reimbursement ?? 0
            ).toLocaleString()}</td></tr>
        <tr><th>Total Addition</th><th class="right">${totalAddition.toLocaleString()}</th></tr>
      </table>

      <!-- Deductions -->
      <table>
        <tr><th>Deductions</th><th class="right">Amount (₹)</th></tr>
        <tr><td>Provident Fund</td><td class="right">-</td></tr>
        <tr><td>E.S.I.</td><td class="right">-</td></tr>
         <tr><td>Professional Tax</td><td class="right">-</td></tr>      
         <tr><td>T.D.S.</td><td class="right">-</td></tr>
      </table>
    </div>

    <div class="net-salary">
      NET SALARY: ₹ ${(
        salary.netPay ?? totalAddition - totalDeduction
      ).toLocaleString()}
    </div>

    <div class="footer">
      <p><b>Mode of Payment:</b> ${salary.modeOfPayment || "NEFT"} &nbsp;&nbsp;
         <b>Bank Name:</b> ${employee.bankDetails?.bankName || "N/A"}</p>
      <p><b>Dated:</b> ${new Date().toLocaleDateString("en-GB")}</p>
    </div>

    <div class="bottom">
      <span><b>DATE:</b> ${new Date().toLocaleDateString("en-GB")}</span>
      <span>Authorized Signatory</span>
    </div>
  </div>
</body>
</html>
`;
};
