import React, { useEffect, useRef } from "react";
import { AppBar, Box, CircularProgress, Typography } from "@mui/material";
import { Toolbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import {
  getReportsConditionAction,
  getReportsMasterAction,
} from "../../../redux/actions/reportsAction";
import Utils from "../../../utils/Utils";
import { setReport } from "../../../redux/reducers/reports";
import Navbar from "./Navbar";
import Filter from "./Filter";

function Reports() {
  const targetRef = useRef();
  const dispatch = useDispatch();
  const { reports, reportCondition, report, loader, reportData } = useSelector(
    (state) => state.reports
  );

  useEffect(() => {
    dispatch(getReportsMasterAction());
  }, []);

  const handleReportClick = (report) => {
    dispatch(setReport(report));
    dispatch(getReportsConditionAction(report.idReport));
  };

  function downloadFile(format) {
    if (format === "excel") {
      Utils.exportToExcel(reportData, report?.reportName, {});
    } else {
      Utils.exportToPdf(reportData, report?.reportName, "landscape", {});
    }
  }

  const columns = Object.keys(reportData[0] || {}).map((key, index) => ({
    field: key,
    headerName: key.replace(/_/g, " "),
    width: Math.max(getMaxLength(key) + 71, getCanvasWidth(key) + 73),
    headerClassName: "bg-secondary text-white",
    flex: index === Object.keys(reportData[0] || {}).length - 1 ? 1 : 0,
    resizable: true,
    headerAlign:
      /Amt|Amount|Discount|Balance/i.test(key) || !isNaN(getValueForKey(key))
        ? "right"
        : "left",
    cellClassName:
      /Amt|Amount|Discount|Balance/i.test(key) || !isNaN(getValueForKey(key))
        ? "text-end"
        : "",
  }));

  function getMaxLength(value) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const longestName = reportData.reduce((max, obj) => {
      if (obj[value]) {
        return context?.measureText(`${obj[value]}`).width > max
          ? context?.measureText(`${obj[value]}`).width
          : max;
      } else {
        return max;
      }
    }, 0);
    return longestName;
  }

  function getCanvasWidth(value) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    return context?.measureText(`${value}`).width;
  }

  function getValueForKey(key) {
    const value = reportData.find((item) => item[key] !== null);
    return value ? value[key] : "";
  }

  const paginationModel = {
    page: 0,
    pageSize: Math.min(reportData?.length || 0, 50),
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
                <Typography
                  key={report.idReport}
                  onClick={() => handleReportClick(report)}
                  variant="body1"
                  sx={{
                    color: "white",
                    cursor: "pointer",
                    fontFamily: "Arial",
                    fontSize: "15px",
                    fontWeight: 500,
                    px: 2,
                  }}
                >
                  {report.reportName}
                </Typography>
              ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Filter
        reportCondition={reportCondition}
        report={report}
        downloadFile={downloadFile}
      />
      <div className="m-3 mt-5 d-flex justify-content-center" ref={targetRef}>
        {reportData && reportData?.length > 0 ? (
          !loader ? (
            <div className="w-[max-content] overflow-x-scroll data-grid">
              <DataGrid
                rows={reportData}
                columns={columns}
                scrollbarSize={20}
                sx={{ overflowX: "scroll" }}
                rowHeight={24}
                columnHeaderHeight={40}
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
          <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full text-center mt-[5rem]">
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
