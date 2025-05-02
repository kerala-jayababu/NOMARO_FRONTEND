import React, { useEffect, useRef } from "react";
import { AppBar, Box, CircularProgress, Menu, MenuItem, Typography } from "@mui/material";
import { Toolbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import {
  getReportsConditionAction,
  getReportsMasterAction,
} from "../../../redux/actions/reportsAction";
import Utils from "../../../utils/Utils";
import { setReport, setReportData, setReports } from "../../../redux/reducers/reports";
import Navbar from "./Navbar";
import Filter from "./Filter";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";

function Reports() {
  const targetRef = useRef();
  const dispatch = useDispatch();
  const { reports, reportCondition, report, loader, reportData } = useSelector(
    (state) => state.reports
  );

  useEffect(() => {
    dispatch(getReportsMasterAction());
    dispatch(setReportData([]));
  }, [report?.reportName]);

  const handleReportClick = (report) => {
    dispatch(setReport(report));
    dispatch(getReportsConditionAction(report.idReport));
  };

  function downloadFile(format, filter) {
    if (format === "excel") {
      Utils.exportToExcelJS(reportData, report?.reportName, filter);
    } else {
      Utils.exportToPdf(reportData, report?.reportName, "landscape", filter);
    }
  }

  const columns = reportData && reportData.length > 0
    ? Object.keys(reportData[0]).map((key, index) => {
        const headerText = key.replace(/_/g, " ");
        const headerWidth = getTextWidth(headerText, 'bold 14px Arial') + 60;
        const contentWidth = getMaxContentWidth(key) + 60;
        const columnWidth = Math.max(headerWidth, contentWidth, 100);
        
        return {
          field: key,
          headerName: headerText,
          width: columnWidth,
          headerClassName: "bg-secondary text-white",
          flex: index === Object.keys(reportData[0]).length - 1 ? 1 : 0,
          resizable: true,
          headerAlign:
            /Amt|Amount|Discount|Balance/i.test(key) || !isNaN(getValueForKey(key))
              ? "right"
              : "left",
          cellClassName:
            /Amt|Amount|Discount|Balance/i.test(key) || !isNaN(getValueForKey(key))
              ? "text-end"
              : "",
        };
      })
    : [];

  function getTextWidth(text, font) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font || '14px Arial';
    return context.measureText(text).width;
  }

  function getMaxContentWidth(key) {
    return reportData.reduce((maxWidth, row) => {
      const cellContent = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
      const contentWidth = getTextWidth(cellContent, '14px Arial');
      return Math.max(maxWidth, contentWidth);
    }, 0);
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
                          onClick={() =>
                              handleReportClick(item)
                          }
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
      />
      <div className="m-3 mt-3 d-flex justify-content-center" ref={targetRef}>
        {reportData && reportData?.length > 0 ? (
          !loader ? (
            <div className="w-max-content overflow-x-scroll data-grid">
              <DataGrid
                rows={reportData}
                columns={columns}
                scrollbarSize={20}
                sx={{ overflowX: "scroll",fontSize:"12px" }}
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
          <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full text-center mt-5">
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
