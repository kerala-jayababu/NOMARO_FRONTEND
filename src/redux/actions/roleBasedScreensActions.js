import * as api from "../api/roleBaseScreenAPI";
import { setPayrollScreen } from "../reducers/roleBasedScreen";

export const getAllPayrollScreensAction = (view) => async (dispatch) => {
  try {
    const response = await api.getAllPayrollScreens(view);
    const { error, data } = response;
    if (!error) {
      dispatch(setPayrollScreen(data.data));
    }
  } catch (error) {}
};
