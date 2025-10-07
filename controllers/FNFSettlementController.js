import { statusCode } from "../helper/statusCodes.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { apiError } from "../utils/apiError.js";
import Employee from "../models/employee.model.js";
import FNFSettlement from "../models/FNFSettlement.model.js";
import AttendancePayroll from "../models/AttendancePayroll.js";

const createFNFSettlement = async (req, res) => {
  try {
    const {
      employeeId,
      resignationDate,
      lastWorkingDay,
      reasonForSeparation,
      noticePeriodDays = 60,
      unpaidSalary = 0,
    } = req.body;

    // 1️⃣ Validate required fields
    if (!employeeId || !resignationDate) {
      return res
        .status(400)
        .json(
          new apiError(400, "Employee ID and resignation date are required.")
        );
    }

    // 2️⃣ Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found."));
    }

    // 3️⃣ Prevent duplicate FNF creation
    const existingFNF = await FNFSettlement.findOne({ employeeId });
    if (existingFNF) {
      return res
        .status(409)
        .json(
          new apiError(409, "FNF Settlement already exists for this employee.")
        );
    }

    // 4️⃣ Fetch last 2 months payroll (optional reference)
    const payrolls = await AttendancePayroll.find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(2);

    // 5️⃣ Calculate payable amounts (dummy logic for now)
    const leaveEncashment = 0;
    const reimbursements = 0;
    const bonusOrAdjustments = 0;
    const deductions = 0;

    const totalPayable =
      unpaidSalary +
      leaveEncashment +
      reimbursements +
      bonusOrAdjustments -
      deductions;

    // 6️⃣ Create FNF record
    const fnfRecord = await FNFSettlement.create({
      employeeId,
      resignationDate,
      lastWorkingDay,
      reasonForSeparation,
      noticePeriodDays,
      salaryDetails: {
        heldNoticeSalary,
        leaveEncashment,
        reimbursements,
        bonusOrAdjustments,
        deductions,
        totalPayable,
      },
      payrollRefs: payrolls.map((p) => p._id),
      statusFlow: {
        clearanceStatus: "pending",
        fnfStatus: "pending",
        initiatedOn: new Date(),
      },
    });

    // 7️⃣ Respond success
    return res
      .status(201)
      .json(
        apiResponseSuccess(
          fnfRecord,
          true,
          201,
          "FNF Settlement initiated successfully."
        )
      );
  } catch (error) {
    console.error("FNF Create Error:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

export { createFNFSettlement };
