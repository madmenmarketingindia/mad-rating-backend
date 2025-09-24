import Rating from "../models/rating.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import Employee from "../models/employee.model.js";
import AttendancePayroll from "../models/AttendancePayroll.js";
import { generateSalarySlipHTML } from "../templates/salarySlipTemplate.js";
import pdf from "html-pdf-node";

// const getSalaryByEmployeeAndYear = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     let { year } = req.query;

//     if (!employeeId) {
//       return res.status(400).json(new apiError(400, "Employee ID is required"));
//     }

//     // ✅ Default year → current year
//     const now = new Date();
//     year = Number(year) || now.getFullYear();

//     // ✅ Fetch employee
//     const employee = await Employee.findById(employeeId);
//     if (!employee) {
//       return res.status(404).json(new apiError(404, "Employee not found"));
//     }

//     const salaryData = {
//       employeeId: employee._id,
//       name: (employee.firstName || "N/A") + " " + (employee.lastName || ""),
//       department: employee.officialDetails?.department || "N/A",
//       designation: employee.officialDetails?.designation || "N/A",
//       totalCTC: 0,
//       totalIncentive: 0,
//       totalNetPay: 0,
//       months: [],
//     };

//     const baseSalary = employee.salary?.ctc || 0;

//     // ✅ Loop through 12 months
//     for (let month = 1; month <= 12; month++) {
//       const payroll = await AttendancePayroll.findOne({
//         employeeId,
//         month,
//         year,
//         status: "Paid", // 🔥 Only Paid
//       });

//       if (!payroll) continue; // skip if not Paid

//       const rating = await Rating.findOne({
//         employeeId,
//         month,
//         year,
//       });

//       const avg = rating?.averageScore || 0;

//       // Incentive calculation
//       let incentive = 0;
//       let incentivePct = 0;
//       if (avg > 4.4) {
//         const minPct = 5;
//         const maxPct = 15;
//         const factor = (avg - 4.4) / (5 - 4.4);
//         incentivePct = minPct + factor * (maxPct - minPct);
//         incentive = (baseSalary * incentivePct) / 100;
//       }

//       const netPay = payroll?.total || baseSalary + incentive;

//       salaryData.months.push({
//         month,
//         year,
//         baseSalary,
//         averageRating: avg,
//         incentivePercent: Number(incentivePct.toFixed(2)),
//         incentiveAmount: Number(incentive.toFixed(2)),
//         netPay: Number(netPay.toFixed(2)),
//         status: payroll?.status || "Pending",
//       });

//       salaryData.totalCTC += baseSalary;
//       salaryData.totalIncentive += incentive;
//       salaryData.totalNetPay += netPay;
//     }

//     return res
//       .status(200)
//       .json(
//         apiResponseSuccess(
//           salaryData,
//           true,
//           statusCode.success,
//           "Employee salary data fetched successfully!"
//         )
//       );
//   } catch (error) {
//     console.error("Error in getSalaryByEmployeeAndYear:", error);
//     return res.status(500).json(new apiError(500, error.message));
//   }
// };

const getSalaryByEmployeeAndYear = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { year } = req.query;

    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    year = Number(year) || new Date().getFullYear();

    // Fetch payroll data directly
    const payrolls = await AttendancePayroll.find({
      employeeId,
      year,
      status: "Paid", // only consider Paid payrolls
    }).sort({ month: 1 });

    if (!payrolls.length) {
      return res
        .status(404)
        .json(
          new apiError(
            404,
            "No payroll records found for this employee and year"
          )
        );
    }

    // Optional: fetch employee basic info
    const employee = await Employee.findById(employeeId);

    const salaryData = {
      employeeId,
      name: employee
        ? `${employee.firstName || "N/A"} ${employee.lastName || ""}`
        : "N/A",
      department: employee?.officialDetails?.department || "N/A",
      designation: employee?.officialDetails?.designation || "N/A",
      totalCTC: 0,
      totalIncentive: 0,
      totalNetPay: 0,
      months: [],
    };

    payrolls.forEach((payroll) => {
      const baseSalary = payroll.basicSalary || 0;
      const incentive = payroll.incentive || 0;
      const netPay = payroll.total || baseSalary + incentive;
      const salary = payroll.salary;
      const teamIncentive = payroll.teamIncentive;

      salaryData.months.push({
        month: payroll.month,
        year: payroll.year,
        baseSalary,
        salary: salary,
        averageRating: 0,
        teamIncentive,
        incentivePercent:
          payroll.incentive && baseSalary
            ? Number(((incentive / baseSalary) * 100).toFixed(2))
            : 0,
        incentiveAmount: Number(incentive.toFixed(2)),
        netPay: Number(netPay.toFixed(2)),
        status: payroll.status,
      });

      salaryData.totalCTC += baseSalary;
      salaryData.totalIncentive += incentive;
      salaryData.totalNetPay += netPay;
    });

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          salaryData,
          true,
          statusCode.success,
          "Employee salary data fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getSalaryByEmployeeAndYear:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

// const getSalaryDetailsByEmployeeMonthYear = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     let { month, year } = req.query;

//     if (!employeeId) {
//       return res.status(400).json(new apiError(400, "Employee ID is required"));
//     }

//     const now = new Date();
//     month = Number(month) || now.getMonth() + 1; // default current month
//     year = Number(year) || now.getFullYear(); // default current year

//     // ✅ Fetch employee details
//     const employee = await Employee.findById(employeeId);
//     if (!employee) {
//       return res.status(404).json(new apiError(404, "Employee not found"));
//     }

//     // ✅ Fetch payroll for this month/year
//     const payroll = await AttendancePayroll.findOne({
//       employeeId,
//       month,
//       year,
//     });
//     if (!payroll) {
//       return res
//         .status(404)
//         .json(new apiError(404, "Payroll not found for this month/year"));
//     }

//     // ✅ Fetch rating for this month/year
//     const rating = await Rating.findOne({ employeeId, month, year });

//     const baseSalary = payroll.salary || employee.salary?.ctc || 0;
//     const avgRating = rating?.averageScore || 0;

//     // Incentive calculation
//     let incentive = payroll.incentive || 0;
//     let incentivePct = 0;
//     if (avgRating > 4.4) {
//       const minPct = 5;
//       const maxPct = 15;
//       const factor = (avgRating - 4.4) / (5 - 4.4);
//       incentivePct = minPct + factor * (maxPct - minPct);
//       incentive = (baseSalary * incentivePct) / 100;
//     }

//     // Total payable
//     const netPay = payroll.total || baseSalary + incentive;

//     const data = {
//       employeeId: employee._id,
//       name: `${employee.firstName || "N/A"} ${employee.lastName || ""}`,
//       department: employee.officialDetails?.department || "N/A",
//       designation: employee.officialDetails?.designation || "N/A",
//       joiningDate: employee.officialDetails?.joiningDate || null,
//       bankDetails: employee.bankDetails || {},
//       salaryDetails: {
//         month,
//         year,
//         baseSalary,
//         totalDays: payroll.totalDays || 0,
//         leaves: payroll.leaves || 0,
//         leaveAdjusted: payroll.leaveAdjusted || 0,
//         absent: payroll.absent || 0,
//         lateIn: payroll.lateIn || 0,
//         lateAdjusted: payroll.lateAdjusted || 0,
//         deductions: payroll.deductions || 0,
//         reimbursement: payroll.reimbursement || 0,
//         incentivePercent: Number(incentivePct.toFixed(2)),
//         incentiveAmount: Number(incentive.toFixed(2)),
//         netPay: Number(netPay.toFixed(2)),
//         payableDays: payroll.payableDays || 0,
//         status: payroll.status || "Pending",
//       },
//       rating: {
//         averageScore: avgRating,
//         totalScore: rating?.totalScore || 0,
//         criteriaScores: rating?.criteriaScores || {},
//       },
//     };

//     return res
//       .status(200)
//       .json(
//         apiResponseSuccess(
//           data,
//           true,
//           statusCode.success,
//           "Salary details fetched successfully!"
//         )
//       );
//   } catch (error) {
//     console.error("Error in getSalaryDetailsByEmployeeMonthYear:", error);
//     return res.status(500).json(new apiError(500, error.message));
//   }
// };

// const downloadSalarySlip = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     let { month, year } = req.query;

//     if (!employeeId) {
//       return res.status(400).json(new apiError(400, "Employee ID is required"));
//     }

//     const now = new Date();
//     month = Number(month) || now.getMonth() + 1;
//     year = Number(year) || now.getFullYear();

//     // Fetch employee
//     const employee = await Employee.findById(employeeId);
//     if (!employee) {
//       return res.status(404).json(new apiError(404, "Employee not found"));
//     }

//     // Fetch payroll
//     const payroll = await AttendancePayroll.findOne({
//       employeeId,
//       month,
//       year,
//     });
//     if (!payroll) {
//       return res
//         .status(404)
//         .json(new apiError(404, "Payroll not found for this month/year"));
//     }

//     // Fetch rating
//     const rating = await Rating.findOne({ employeeId, month, year });
//     const avgRating = rating?.averageScore || 0;

//     // Salary calculations
//     const baseSalary = payroll.salary || employee.salary?.ctc || 0;
//     let incentive = payroll.incentive || 0;
//     let incentivePct = 0;
//     if (avgRating > 4.4) {
//       const minPct = 5;
//       const maxPct = 15;
//       const factor = (avgRating - 4.4) / (5 - 4.4);
//       incentivePct = minPct + factor * (maxPct - minPct);
//       incentive = (baseSalary * incentivePct) / 100;
//     }
//     const netPay = payroll.total || baseSalary + incentive;

//     // ✅ Generate PDF
//     const doc = new PDFDocument({ margin: 40 });
//     let buffers = [];
//     doc.on("data", buffers.push.bind(buffers));
//     doc.on("end", () => {
//       const pdfData = Buffer.concat(buffers);
//       res
//         .writeHead(200, {
//           "Content-Type": "application/pdf",
//           "Content-Disposition": `attachment; filename=SalarySlip-${employee.firstName}-${month}-${year}.pdf`,
//           "Content-Length": pdfData.length,
//         })
//         .end(pdfData);
//     });

//     // Header
//     doc
//       .fontSize(16)
//       .text("MAD MEN MARKETING OPC PRIVATE LIMITED", { align: "center" });
//     doc
//       .fontSize(10)
//       .text(
//         "N-29, RIVERA APARTMENTS, 45 MALL ROAD, CIVIL LINES, NEW DELHI-110054",
//         { align: "center" }
//       );
//     doc.moveDown();

//     doc.fontSize(12).text("SALARY SLIP", { align: "center", underline: true });
//     doc.moveDown();

//     // Employee details
//     doc
//       .fontSize(10)
//       .text(`Employee Name: ${employee.firstName} ${employee.lastName}`);
//     doc.text(`Designation: ${employee.officialDetails?.designation || "N/A"}`);
//     doc.text(
//       `Date of Joining: ${employee.officialDetails?.joiningDate || "N/A"}`
//     );
//     doc.text(`Month & Year: ${month}-${year}`);
//     doc.moveDown();

//     // Earnings / Deductions table
//     doc.fontSize(11).text("Earnings", { underline: true });
//     doc
//       .fontSize(10)
//       .list([
//         `Basic Salary: ₹ ${baseSalary.toFixed(2)}`,
//         `Incentive (${incentivePct.toFixed(2)}%): ₹ ${incentive.toFixed(2)}`,
//         `Reimbursement: ₹ ${payroll.reimbursement || 0}`,
//       ]);
//     doc.moveDown();

//     doc.fontSize(11).text("Deductions", { underline: true });
//     doc
//       .fontSize(10)
//       .list([
//         `Leaves Deduction: ₹ ${payroll.deductions || 0}`,
//         `Other Adjustments: ₹ ${payroll.leaveAdjusted || 0}`,
//       ]);
//     doc.moveDown();

//     // Net Salary
//     doc.fontSize(12).text(`NET SALARY: ₹ ${netPay.toFixed(2)}`, {
//       align: "right",
//       underline: true,
//     });
//     doc.moveDown();

//     // Footer
//     doc
//       .fontSize(10)
//       .text(`Mode of Payment: ${payroll.modeOfPayment || "NEFT"}`);
//     doc.text(`Bank: ${employee.bankDetails?.bankName || "N/A"}`);
//     doc.text(`Dated: ${new Date().toLocaleDateString()}`);
//     doc.moveDown(2);

//     doc.fontSize(10).text("Authorized Signatory", { align: "right" });

//     doc.end();
//   } catch (error) {
//     console.error("Error in downloadSalarySlip:", error);
//     return res.status(500).json(new apiError(500, error.message));
//   }
// };

// const downloadSalarySlip = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     let { month, year } = req.query;

//     if (!employeeId)
//       return res.status(400).json(new apiError(400, "Employee ID is required"));

//     const now = new Date();
//     month = Number(month) || now.getMonth() + 1;
//     year = Number(year) || now.getFullYear();

//     const employee = await Employee.findById(employeeId);
//     if (!employee)
//       return res.status(404).json(new apiError(404, "Employee not found"));

//     const payroll = await AttendancePayroll.findOne({
//       employeeId,
//       month,
//       year,
//     });
//     if (!payroll)
//       return res.status(404).json(new apiError(404, "Payroll not found"));

//     const rating = await Rating.findOne({ employeeId, month, year });
//     const avgRating = rating?.averageScore || 0;

//     const baseSalary = payroll.salary || employee.salary?.ctc || 0;
//     let incentive = payroll.incentive || 0;
//     let incentivePct = 0;
//     if (avgRating > 4.4) {
//       const minPct = 5;
//       const maxPct = 15;
//       const factor = (avgRating - 4.4) / (5 - 4.4);
//       incentivePct = minPct + factor * (maxPct - minPct);
//       incentive = (baseSalary * incentivePct) / 100;
//     }
//     const netPay = payroll.total || baseSalary + incentive;

//     const htmlContent = generateSalarySlipHTML({
//       employee,
//       payroll,
//       avgRating,
//       baseSalary,
//       incentive,
//       incentivePct,
//       netPay,
//       month,
//       year,
//     });

//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" });
//     const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
//     await browser.close();

//     res
//       .writeHead(200, {
//         "Content-Type": "application/pdf",
//         "Content-Disposition": `attachment; filename=SalarySlip-${employee.firstName}-${month}-${year}.pdf`,
//         "Content-Length": pdfBuffer.length,
//       })
//       .end(pdfBuffer);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json(new apiError(500, error.message));
//   }
// };

const getSalaryDetailsByEmployeeMonthYear = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { month, year } = req.query;

    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    const now = new Date();
    month = Number(month) || now.getMonth() + 1;
    year = Number(year) || now.getFullYear();

    // Fetch payroll for this employee, month, year
    const payroll = await AttendancePayroll.findOne({
      employeeId,
      month,
      year,
    });

    if (!payroll) {
      return res
        .status(404)
        .json(new apiError(404, "Payroll not found for this month/year"));
    }

    // Optional: fetch employee basic info for name/department
    const employee = await Employee.findById(employeeId);

    // Use payroll values directly
    const baseSalary = payroll.basicSalary || 0;
    const incentive = payroll.incentive || 0;
    const netPay = payroll.total || baseSalary + incentive;
    const teamIncentive = payroll.teamIncentive || 0;

    // Incentive percent
    const incentivePct = baseSalary
      ? Number(((incentive / baseSalary) * 100).toFixed(2))
      : 0;

    // Optional: fetch rating for month/year
    const rating = await Rating.findOne({ employeeId, month, year });
    const avgRating = rating?.averageScore || 0;

    const data = {
      employeeId,
      name: employee
        ? `${employee.firstName || "N/A"} ${employee.lastName || ""}`
        : "N/A",
      department: employee?.officialDetails?.department || "N/A",
      designation: employee?.officialDetails?.designation || "N/A",
      joiningDate: employee?.officialDetails?.joiningDate || null,
      bankDetails: payroll.bankName
        ? {
            bankName: payroll.bankName,
            accountNo: payroll.accountNo,
            ifscCode: payroll.ifscCode,
          }
        : employee?.bankDetails || {},
      salaryDetails: {
        month,
        year,
        salary: payroll.salary,
        baseSalary,
        hra: payroll.hra,
        medicalAllowance: payroll.medicalAllowance,
        conveyanceAllowance: payroll.conveyanceAllowance,
        totalDays: payroll.totalDays || 0,
        present: payroll.present || 0,
        leaves: payroll.leaves || 0,
        leaveAdjusted: payroll.leaveAdjusted || 0,
        absent: payroll.absent || 0,
        lateIn: payroll.lateIn || 0,
        lateAdjusted: payroll.lateAdjusted || 0,
        teamIncentive,
        deductions: payroll.deductions || 0,
        reimbursement: payroll.reimbursement || 0,
        incentiveAmount: Number(incentive.toFixed(2)),
        netPay: Number(netPay.toFixed(2)),
        payableDays: payroll.payableDays || 0,
        status: payroll.status || "Pending",
      },
      rating: {
        averageScore: avgRating,
        totalScore: rating?.totalScore || 0,
        criteriaScores: rating?.criteriaScores || {},
      },
    };

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          data,
          true,
          statusCode.success,
          "Salary details fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error in getSalaryDetailsByEmployeeMonthYear:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

// const downloadSalarySlip = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     let { month, year } = req.query;

//     if (!employeeId) {
//       return res.status(400).json(new apiError(400, "Employee ID is required"));
//     }

//     const now = new Date();
//     month = Number(month) || now.getMonth() + 1;
//     year = Number(year) || now.getFullYear();

//     // 1. Get employee
//     const employee = await Employee.findById(employeeId);
//     if (!employee) {
//       return res.status(404).json(new apiError(404, "Employee not found"));
//     }

//     // 2. Get payroll
//     const payroll = await AttendancePayroll.findOne({
//       employeeId,
//       month,
//       year,
//     });
//     if (!payroll) {
//       return res.status(404).json(new apiError(404, "Payroll not found"));
//     }

//     // 3. Get rating
//     const rating = await Rating.findOne({ employeeId, month, year });
//     // 4. Convert AttendancePayroll → salary format
//     const salary = {
//       month: payroll.month,
//       year: payroll.year,
//       salary: payroll.salary ?? 0,
//       basicSalary: payroll.basicSalary ?? 0,
//       hra: payroll.hra ?? 0,
//       medicalAllowance: payroll.medicalAllowance ?? 0,
//       conveyanceAllowance: payroll.conveyanceAllowance ?? 0,
//       totalDays: payroll.totalDays ?? 0,
//       payableDays: payroll.payableDays ?? 0,
//       leaves: payroll.leaves ?? 0,
//       leaveAdjusted: payroll.leaveAdjusted ?? 0,
//       absent: payroll.absent ?? 0,
//       lateIn: payroll.lateIn ?? 0,
//       lateAdjusted: payroll.lateAdjusted ?? 0,
//       deductions: payroll.deductions ?? 0,
//       reimbursement: payroll.reimbursement ?? 0,
//       incentivePercent: payroll.incentive
//         ? ((payroll.incentive / (payroll.salary || 1)) * 100).toFixed(2)
//         : 0,
//       incentiveAmount: payroll.incentive ?? 0,
//       teamIncentive: payroll.teamIncentive ?? 0,
//       netPay: payroll.total ?? 0,
//       status: payroll.status,
//       modeOfPayment: payroll.modeOfPayment ?? "NEFT",
//     };

//     // 5. Generate HTML
//     const htmlContent = generateSalarySlipHTML({
//       employee,
//       salary,
//       rating,
//       month,
//       year,
//     });

//     // Launch headless Chromium from chrome-aws-lambda
//     const browser = await puppeteer.launch({
//       args: chromium.args,
//       defaultViewport: chromium.defaultViewport,
//       executablePath: await chromium.executablePath,
//       headless: true,
//     });

//     // 6. Generate PDF with Puppeteer
//     // const browser = await puppeteer.launch({ headless: "new" });
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" });
//     const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
//     await browser.close();

//     // 7. Send PDF
//     res.writeHead(200, {
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=SalarySlip-${
//         employee.firstName || "Employee"
//       }-${month}-${year}.pdf`,
//       "Content-Length": pdfBuffer.length,
//     });
//     res.end(pdfBuffer);
//   } catch (error) {
//     console.error("Download Salary Slip Error:", error);
//     return res.status(500).json(new apiError(500, error.message));
//   }
// };

const downloadSalarySlip = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { month, year } = req.query;

    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    const now = new Date();
    month = Number(month) || now.getMonth() + 1;
    year = Number(year) || now.getFullYear();

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    const payroll = await AttendancePayroll.findOne({
      employeeId,
      month,
      year,
    });
    if (!payroll) {
      return res.status(404).json(new apiError(404, "Payroll not found"));
    }

    const rating = await Rating.findOne({ employeeId, month, year });

    // Prepare salary object
    const salary = {
      basicSalary: payroll.basicSalary ?? 0,
      hra: payroll.hra ?? 0,
      conveyanceAllowance: payroll.conveyanceAllowance ?? 0,
      medicalAllowance: payroll.medicalAllowance ?? 0,
      incentiveAmount: payroll.incentive ?? 0,
      teamIncentive: payroll.teamIncentive ?? 0,
      reimbursement: payroll.reimbursement ?? 0,
      leaveAdjusted: payroll.leaveAdjusted ?? 0,
      deductions: payroll.deductions ?? 0,
      netPay: payroll.total ?? 0,
      modeOfPayment: payroll.modeOfPayment ?? "NEFT",
    };

    const htmlContent = generateSalarySlipHTML({
      employee,
      salary,
      rating,
      month,
      year,
    });

    const file = { content: htmlContent };
    const options = { format: "A4", printBackground: true };

    const pdfBuffer = await pdf.generatePdf(file, options);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=SalarySlip-${employee.firstName}-${month}-${year}.pdf`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Download Salary Slip Error:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  getSalaryByEmployeeAndYear,
  getSalaryDetailsByEmployeeMonthYear,
  downloadSalarySlip,
};
