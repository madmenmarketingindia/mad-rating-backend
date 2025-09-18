import Rating from "../models/rating.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import Employee from "../models/employee.model.js";
import AttendancePayroll from "../models/AttendancePayroll.js";

const getSalaryByEmployeeAndYear = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { year } = req.query;

    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    // ✅ Default year → current year
    const now = new Date();
    year = Number(year) || now.getFullYear();

    // ✅ Fetch employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    const salaryData = {
      employeeId: employee._id,
      name: (employee.firstName || "N/A") + " " + (employee.lastName || ""),
      department: employee.officialDetails?.department || "N/A",
      designation: employee.officialDetails?.designation || "N/A",
      totalCTC: 0,
      totalIncentive: 0,
      totalNetPay: 0,
      months: [],
    };

    const baseSalary = employee.salary?.ctc || 0;

    // ✅ Loop through 12 months
    for (let month = 1; month <= 12; month++) {
      const payroll = await AttendancePayroll.findOne({
        employeeId,
        month,
        year,
        status: "Paid", // 🔥 Only Paid
      });

      if (!payroll) continue; // skip if not Paid

      const rating = await Rating.findOne({
        employeeId,
        month,
        year,
      });

      const avg = rating?.averageScore || 0;

      // Incentive calculation
      let incentive = 0;
      let incentivePct = 0;
      if (avg > 4.4) {
        const minPct = 5;
        const maxPct = 15;
        const factor = (avg - 4.4) / (5 - 4.4);
        incentivePct = minPct + factor * (maxPct - minPct);
        incentive = (baseSalary * incentivePct) / 100;
      }

      const netPay = payroll?.total || baseSalary + incentive;

      salaryData.months.push({
        month,
        year,
        baseSalary,
        averageRating: avg,
        incentivePercent: Number(incentivePct.toFixed(2)),
        incentiveAmount: Number(incentive.toFixed(2)),
        netPay: Number(netPay.toFixed(2)),
        status: payroll?.status || "Pending",
      });

      salaryData.totalCTC += baseSalary;
      salaryData.totalIncentive += incentive;
      salaryData.totalNetPay += netPay;
    }

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

const getSalaryDetailsByEmployeeMonthYear = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { month, year } = req.query;

    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    const now = new Date();
    month = Number(month) || now.getMonth() + 1; // default current month
    year = Number(year) || now.getFullYear(); // default current year

    // ✅ Fetch employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    // ✅ Fetch payroll for this month/year
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

    // ✅ Fetch rating for this month/year
    const rating = await Rating.findOne({ employeeId, month, year });

    const baseSalary = payroll.salary || employee.salary?.ctc || 0;
    const avgRating = rating?.averageScore || 0;

    // Incentive calculation
    let incentive = payroll.incentive || 0;
    let incentivePct = 0;
    if (avgRating > 4.4) {
      const minPct = 5;
      const maxPct = 15;
      const factor = (avgRating - 4.4) / (5 - 4.4);
      incentivePct = minPct + factor * (maxPct - minPct);
      incentive = (baseSalary * incentivePct) / 100;
    }

    // Total payable
    const netPay = payroll.total || baseSalary + incentive;

    const data = {
      employeeId: employee._id,
      name: `${employee.firstName || "N/A"} ${employee.lastName || ""}`,
      department: employee.officialDetails?.department || "N/A",
      designation: employee.officialDetails?.designation || "N/A",
      joiningDate: employee.officialDetails?.joiningDate || null,
      bankDetails: employee.bankDetails || {},
      salaryDetails: {
        month,
        year,
        baseSalary,
        totalDays: payroll.totalDays || 0,
        leaves: payroll.leaves || 0,
        leaveAdjusted: payroll.leaveAdjusted || 0,
        absent: payroll.absent || 0,
        lateIn: payroll.lateIn || 0,
        lateAdjusted: payroll.lateAdjusted || 0,
        deductions: payroll.deductions || 0,
        reimbursement: payroll.reimbursement || 0,
        incentivePercent: Number(incentivePct.toFixed(2)),
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

export { getSalaryByEmployeeAndYear, getSalaryDetailsByEmployeeMonthYear };
