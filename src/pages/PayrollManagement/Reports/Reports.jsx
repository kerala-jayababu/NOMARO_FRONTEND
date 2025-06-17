import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Box,
  CircularProgress,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { saveAs } from "file-saver";
import { Toolbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import { API } from "../../../redux/api/utils";
import {
  getReportsConditionAction,
  getReportsMasterAction,
} from "../../../redux/actions/reportsAction";
import Utils from "../../../utils/Utils";
import {
  setReport,
  setReportData,
  setReports,
} from "../../../redux/reducers/reports";
import Navbar from "./Navbar";
import Filter from "./Filter";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";

function Reports() {
  const targetRef = useRef();
  const dispatch = useDispatch();
  const [filterParams, setFilterParams] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const {
    reports,
    reportCondition,
    report,
    loader,
    reportData,
    reportColumns,
  } = useSelector((state) => state.reports);

  useEffect(() => {
    dispatch(getReportsMasterAction());
    dispatch(setReportData([]));
  }, [report?.reportName]);

  const handleReportClick = (report) => {
    dispatch(setReport(report));
    dispatch(getReportsConditionAction(report.idReport));
  };
  const handleFilterChange = (filter, applied) => {
    setFilterParams(filter);
    setAppliedFilters(applied);
  };

  async function downloadFile(format, filter) {
    const isGuyanaTaxReport = report?.reportName === "Guyana Tax Report";
    const isGuyanaNISReport = report?.reportName === "Guyana NIS Report";

    if (format === "pdf" && (isGuyanaTaxReport || isGuyanaNISReport)) {
      try {
        if (isGuyanaTaxReport) {
          const payrollId = filterParams["@SalaryMonth"];
          if (!payrollId) {
            return;
          }
          const res = await API.post(
            `/api/v1/Reports/GenerateIncomeTax?payrollId=${payrollId}`
          );

          const { fileName, contentType, fileBytes } = res.data;

          const byteCharacters = atob(fileBytes);
          const byteArray = new Uint8Array(
            Array.from(byteCharacters).map((char) => char.charCodeAt(0))
          );

          const blob = new Blob([byteArray], {
            type: contentType || "application/pdf",
          });

          saveAs(blob, fileName || "Guyana_Income_Tax_Report.pdf");
        }

        if (isGuyanaNISReport) {
          debugger;
          const payrollId = filterParams["@SalaryMonth"];
          let ageGroup = filterParams["@AgeGroup"];

          if (!payrollId) {
            return;
          }
          if (!ageGroup || ageGroup.trim() === "") {
            ageGroup = "BELOW60";
          }
          const res = await API.post(
            `/api/v1/Reports/generate-nis?payrollId=${payrollId}&ageGroup=${encodeURIComponent(
              ageGroup
            )}`
          );

          const { fileName, contentType, fileBytes } = res.data;

          const byteCharacters = atob(fileBytes);
          const byteArray = new Uint8Array(
            Array.from(byteCharacters).map((char) => char.charCodeAt(0))
          );

          const blob = new Blob([byteArray], {
            type: contentType || "application/pdf",
          });
          saveAs(blob, fileName || "Guyana_NIS_Contribution_Report.pdf");
        }
      } catch (err) {
        console.error("Error generating PDF report:", err);
        alert("Failed to generate the report.");
      }

      return;
    }

    // Fallback for other report types
    if (format === "excel") {
      Utils.exportToExcelJS(
        reportData,
        report?.reportName,
        report?.headerRequired,
        filter,
        reportColumns
      );
    } else if (format === "text") {
      Utils.exportToTxt(
        reportData,
        report?.reportName,
        report?.headerRequired,
        filter,
        reportColumns
      );
    } else {
      Utils.exportToPdf(
        reportData,
        report?.reportName,
        "landscape",
        filter,
        reportColumns
      );
    }
  }
  const columns =
    reportData && reportData.length > 0
      ? Object.keys(reportData[0]).map((key, index) => {
          const config = reportColumns?.find((item) => item.columnName === key);
          const headerText = key.replace(/_/g, " ");
          const headerWidth = getTextWidth(headerText, "bold 14px Arial") + 60;
          const contentWidth = getMaxContentWidth(key) + 60;
          const columnWidth = Math.max(headerWidth, contentWidth, 100);
          const alignment = getAlignment(config, key);
          const isTotalEarningColumn = [
            "totalearnings",
            "netsalary",
            "totaldeductions",
          ].includes(headerText.toLowerCase());

          return {
            field: key,
            headerName: headerText,
            width: columnWidth,
            headerClassName: "bg-secondary text-white",
            flex: index === Object.keys(reportData[0]).length - 1 ? 1 : 0,
            resizable: true,
            headerAlign: alignment,
            cellClassName: () => {
              let classes = [];
              if (alignment === "right") {
                classes.push("text-end");
              }
              if (isTotalEarningColumn) {
                classes.push("text-bold");
              }
              return classes.join(" ");
            },
          };
        })
      : [];

  function getAlignment(config, key) {
    const value = getValueForKey(key);
    if (config?.alignment === "LEFT") {
      return "left";
    } else if (config?.alignment === "RIGHT") {
      return "right";
    } else if (/Amt|Amount|Discount|Balance/i.test(key)) {
      return "right";
    } else {
      return "left";
    }
  }

  function getTextWidth(text, font) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font || "14px Arial";
    return context.measureText(text).width;
  }

  function getMaxContentWidth(key) {
    return reportData.reduce((maxWidth, row) => {
      const cellContent =
        row[key] !== null && row[key] !== undefined ? String(row[key]) : "";
      const contentWidth = getTextWidth(cellContent, "14px Arial");
      return Math.max(maxWidth, contentWidth);
    }, 0);
  }

  function getValueForKey(key) {
    const value = reportData.find(
      (item) => item[key] !== null && item[key] !== undefined
    );

    if (value && value[key] !== null && value[key] !== undefined) {
      return `${value[key]}`.replaceAll(",", "");
    }

    return "";
  }

  const paginationModel = {
    page: 0,
    pageSize: Math.min(reportData?.length || 0, 20),
  };

  return (
    <>
      <Navbar />
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#007B8F",
          padding: 0,
        }}
      >
        <Toolbar
          sx={{
            minHeight: "40px",
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "Poppins",
            paddingLeft: 1,
            paddingRight: 1,
            "@media (min-width: 600px)": {
              minHeight: "50px",
            },
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            {reports &&
              reports.map((report) => (
                <PopupState
                  variant="popover"
                  popupId={`menu-popup-${report.reportName}`}
                  key={report.reportName}
                >
                  {(popupState) => (
                    <React.Fragment>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "white",
                          cursor: "pointer",
                          fontFamily: "Arial",
                          fontSize: "13px",
                          fontWeight: 500,
                          px: 2,
                          textDecoration: "underline",
                        }}
                        {...bindTrigger(popupState)}
                      >
                        {report.reportName}
                      </Typography>
                      <Menu {...bindMenu(popupState)}>
                        {report.subMenu.map((item) => (
                          <MenuItem
                            key={item.reportName}
                            onClick={() => {
                              handleReportClick(item);
                              popupState.close();
                            }}
                            sx={{
                              fontFamily: "Arial",
                              fontSize: "12px",
                              fontWeight: 400,
                              color: "#000",
                            }}
                          >
                            {item.reportName}
                          </MenuItem>
                        ))}
                      </Menu>
                    </React.Fragment>
                  )}
                </PopupState>
              ))}
          </Box>
          <Box>
            <Typography
              variant="body1"
              sx={{
                color: "white",
                cursor: "pointer",
                fontFamily: "Poppins",
                fontSize: "15px",
                fontWeight: 600,
                px: 2,
              }}
            >
              {report?.reportName}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Filter
        reportCondition={reportCondition}
        report={report}
        downloadFile={downloadFile}
        onFilterChange={handleFilterChange}
      />
      <div
        className="m-3 mt-3 d-flex justify-content-center "
        style={{
          height: "calc(100vh - 180px)", // Adjust based on your header/filter height
          overflowY: "auto",
        }}
        ref={targetRef}
      >
        {reportData && reportData?.length > 0 ? (
          !loader ? (
            <div className="w-max-content overflow-x-scroll data-grid">
              <DataGrid
                rows={reportData}
                columns={columns}
                scrollbarSize={20}
                sx={{
                  overflowX: "scroll",
                  fontSize: "12px",
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid rgba(224, 224, 224, 1)",
                    backgroundColor: "#fff",
                  },
                }}
                rowHeight={24}
                columnHeaderHeight={40}
                getRowClassName={(params) => {
                  return params.row[Object.keys(reportData[0])[0]]?.includes(
                    "Grand Total"
                  )
                    ? "bg-A6A6A6 text-bold"
                    : "";
                }}
                initialState={{
                  pagination: { paginationModel },
                }}
                slotProps={{
                  pagination: {
                    showFirstButton: true,
                    showLastButton: true,
                  },
                }}
                pageSizeOptions={[20, 40, 50, 100]}
                columnVisibilityModel={{
                  id: false,
                }}
              />
            </div>
          ) : (
            <CircularProgress className="mt-[5rem]" />
          )
        ) : !loader ? (
          <div
            className="bg-white shadow-md rounded-lg p-6 max-w-md w-full text-center mt-5"
            style={{ height: "20%" }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              No Data Available
            </h2>
            <p className="text-gray-500">
              There is currently no data to display.
            </p>
          </div>
        ) : (
          <>
            <CircularProgress className="mt-[5rem]" />
          </>
        )}
      </div>
    </>
  );
}

export default Reports;
