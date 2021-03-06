import { nanoid } from 'nanoid';
import { toast } from 'react-toastify';
import dictionary from '@utils/dictionary';
import { DateTime } from 'luxon';
import {
  getAbsFromValue, getBeginOfMonth, getBeginOfDay, getSumByArray,
} from '../utils/functions';
import Type from './action-types';
import fetchData from '../utils/fetch';
import { sendAmplitudeEvent, setAmplitudeUserId } from '../utils/amplitude';

/* Actions */

export const setDate = (epoch) => ({
  type: Type.SET_DATE,
  payload: epoch,
});

export const setIsDateChanged = (bool) => ({
  type: Type.SET_IS_DATE_CHANGED,
  payload: bool,
});

export const setUserInfo = (data) => ({
  type: Type.SET_USER_INFO,
  payload: data,
});

export const setUserAccessToken = (data) => ({
  type: Type.SET_USER_ACCESS_TOKEN,
  payload: data,
});

export const setIncomes = (obj) => ({
  type: Type.SET_INCOMES_DATA,
  payload: obj,
});

export const setCosts = (data) => ({
  type: Type.SET_COSTS_DATA,
  payload: data,
});

export const setSavings = (data) => ({
  type: Type.SET_SAVINGS_DATA,
  payload: data,
});

export const setSpendings = (data) => ({
  type: Type.SET_SPENDINGS_DATA,
  payload: data,
});

export const setSaldo = (data) => ({
  type: Type.SET_SALDO_DATA,
  payload: data,
});

export const setOverviewData = (obj) => ({
  type: Type.SET_OVERVIEW_DATA,
  payload: obj,
});

export const setIsFetchFailed = (bool) => ({
  type: Type.SET_IS_FETCH_FAILED,
  payload: bool,
});

export const resetStore = () => ({
  type: Type.RESET_STORE,
});

/* Fetches */

export const fetchUserInfo = () => async (dispatch) => {
  try {
    const userInfo = await fetchData(process.env.USERS_URL, 'GET');
    dispatch(setUserInfo(userInfo));

    setAmplitudeUserId(userInfo.id);
    sendAmplitudeEvent('session started');
  } catch (error) {
    toast.error('Не удалось загрузить данные пользователя.');
    dispatch(setIsFetchFailed(true));
  }
};

export const fetchIncomes = () => async (dispatch, getState) => {
  const { date } = getState();
  const currentMonth = getBeginOfMonth(date) / 1000;

  try {
    const currentIncomes = await fetchData(`${process.env.INCOMES_URL}?date=${currentMonth}`, 'GET');
    const currentIncomesSum = currentIncomes.length > 0 ? getSumByArray(currentIncomes) : 0;
    dispatch(setIncomes({ currentIncomes, currentIncomesSum }));
  } catch (error) {
    toast.error('Не удалось загрузить доходы.');
    dispatch(setIsFetchFailed(true));
  }
};

export const fetchCosts = () => async (dispatch, getState) => {
  const { date } = getState();
  const currentMonth = getBeginOfMonth(date) / 1000;

  try {
    const currentCosts = await fetchData(`${process.env.COSTS_URL}?date=${currentMonth}`, 'GET');
    const currentCostsSum = currentCosts.length > 0 ? getSumByArray(currentCosts) : 0;
    dispatch(setCosts({ currentCosts, currentCostsSum }));
  } catch (error) {
    toast.error('Не удалось загрузить постоянные расходы.');
    dispatch(setIsFetchFailed(true));
  }
};

export const fetchSpendings = () => async (dispatch, getState) => {
  const { date } = getState();
  const currentDay = getBeginOfDay(date) / 1000;

  try {
    const response = await fetchData(`${process.env.SPENDINGS_URL}?date=${currentDay}`, 'GET');
    const prevDaysSpendingsSum = response.prev_days_sum;
    const currentSpendings = response.today_spendings;
    const currentSpendingsSum = currentSpendings.length > 0 ? getSumByArray(currentSpendings) : 0;
    dispatch(setSpendings({ prevDaysSpendingsSum, currentSpendings, currentSpendingsSum }));
  } catch (error) {
    toast.error('Не удалось загрузить дневные траты.');
    dispatch(setIsFetchFailed(true));
  }
};

export const fetchSavings = () => async (dispatch, getState) => {
  const { date } = getState();
  const currentMonth = getBeginOfMonth(date) / 1000;

  try {
    const savings = await fetchData(`${process.env.SAVINGS_URL}?date=${currentMonth}`, 'GET');
    const currentSavingsUnformated = savings.find((item) => item.date === currentMonth);
    const currentSavings = currentSavingsUnformated
      ? {
        ...currentSavingsUnformated,
        value: currentSavingsUnformated.type === 0
          ? currentSavingsUnformated.value
          : currentSavingsUnformated.percent,
      }
      : {
        date: currentMonth,
        value: 0,
        type: 0,
      };
    //const currentYearSavings = savings.filter((item) => item.date !== currentMonth);
    const currentYearSavings = savings;
    dispatch(setSavings({ currentYearSavings, currentSavings }));
  } catch (error) {
    toast.error('Не удалось загрузить сбережения.');
    dispatch(setIsFetchFailed(true));
  }
};

export const fetchSaldo = () => async (dispatch, getState) => {
  const { date } = getState();
  const currentDay = getBeginOfDay(date) / 1000;

  try {
    const response = await fetchData(`${process.env.SALDO_URL}?date=${currentDay}`, 'GET');
    const currentSaldo = response;

    dispatch(setSaldo({ currentSaldo }));
  } catch (error) {
    toast.error('Не удалось загрузить динамику дневных остатков.');
    dispatch(setIsFetchFailed(true));
  }
};

/* Overview */

const calculateOverviewData = () => async (dispatch, getState) => {
  const {
    currentIncomesSum,
    currentCostsSum,
    currentSavings,
    prevDaysSpendingsSum,
    date,
  } = getState();

  const currentDateTime = DateTime.fromMillis(date);
  const currentSavingsSum = getAbsFromValue(currentSavings.value, currentSavings.type, currentIncomesSum);
  const currentProfit = currentIncomesSum - currentCostsSum - currentSavingsSum;
  const currentFixedBudget = currentProfit / currentDateTime.daysInMonth;
  const currentDailyBudget = Math.round(currentFixedBudget * currentDateTime.day - prevDaysSpendingsSum);

  const currentRestValue = currentProfit - prevDaysSpendingsSum;
  const currentRestPercent = currentRestValue > 0
    ? Math.round((currentRestValue / currentProfit) * 100)
    : 0;

  dispatch(setOverviewData({
    currentDailyBudget,
    currentSavingsSum,
    currentRestValue,
    currentRestPercent,
  }));
};

/* CashFlows */

export const addCashFlow = (type) => (dispatch, getState) => {
  let currentCashFlows = [];
  let dispatchedFunction = null;
  let dispatchedObject = {};

  const {
    currentIncomes, currentCosts, currentSpendings, date,
  } = getState();

  switch (type) {
    case dictionary.DATA_LIST_TYPE_INCOMES:
      currentCashFlows = currentIncomes;
      dispatchedFunction = setIncomes;
      dispatchedObject = {
        currentIncomes: [],
        currentIncomesSum: null,
      };
      break;
    case dictionary.DATA_LIST_TYPE_COSTS:
      currentCashFlows = currentCosts;
      dispatchedFunction = setCosts;
      dispatchedObject = {
        currentCosts: [],
        currentCostsSum: null,
      };
      break;
    case dictionary.DATA_LIST_TYPE_SPENDINGS:
      currentCashFlows = currentSpendings;
      dispatchedFunction = setSpendings;
      dispatchedObject = {
        currentSpendings: [],
        currentSpendingsSum: null,
      };
      break;
    default:
      toast.error('Не выбран тип CashFlow-объекта.');
      return false;
  }

  const newCashFlowsList = [...currentCashFlows, {
    id: nanoid(),
    name: '',
    value: null,
    status: true,
    date: getBeginOfMonth(date),
    isNew: true,
  }];

  switch (type) {
    case dictionary.DATA_LIST_TYPE_INCOMES:
      dispatchedObject = {
        currentIncomes: newCashFlowsList,
        currentIncomesSum: getSumByArray(newCashFlowsList),
      };
      break;
    case dictionary.DATA_LIST_TYPE_COSTS:
      dispatchedObject = {
        currentCosts: newCashFlowsList,
        currentCostsSum: getSumByArray(newCashFlowsList),
      };
      break;
    case dictionary.DATA_LIST_TYPE_SPENDINGS:
      dispatchedObject = {
        currentSpendings: newCashFlowsList,
        currentSpendingsSum: getSumByArray(newCashFlowsList),
      };
      break;
    default:
      break;
  }

  dispatch(dispatchedFunction(dispatchedObject));
};

export const deleteCashFlow = (item, type) => (dispatch, getState) => {
  let currentCashFlows = [];
  let dispatchedFunction = null;
  let dispatchedObject = {};
  let requestURL = '';

  const {
    date, currentIncomes, currentCosts, currentSpendings,
  } = getState();
  const currentMonth = getBeginOfMonth(date) / 1000;

  switch (type) {
    case dictionary.DATA_LIST_TYPE_INCOMES:
      currentCashFlows = currentIncomes;
      dispatchedFunction = setIncomes;
      dispatchedObject = {
        currentIncomes: [],
        currentIncomesSum: null,
      };
      requestURL = `${process.env.INCOMES_URL}${item.id}/?date=${currentMonth}`;
      break;
    case dictionary.DATA_LIST_TYPE_COSTS:
      currentCashFlows = currentCosts;
      dispatchedFunction = setCosts;
      dispatchedObject = {
        currentCosts: [],
        currentCostsSum: null,
      };
      requestURL = `${process.env.COSTS_URL}${item.id}/?date=${currentMonth}`;
      break;
    case dictionary.DATA_LIST_TYPE_SPENDINGS:
      currentCashFlows = currentSpendings;
      dispatchedFunction = setSpendings;
      dispatchedObject = {
        currentSpendings: [],
        currentSpendingsSum: null,
      };
      requestURL = `${process.env.SPENDINGS_URL}${item.id}/?date=${currentMonth}`;
      break;
    default:
      toast.error('Не выбран тип CashFlow-объекта.');
      return false;
  }

  let newCashFlowsList = currentCashFlows.map((cashFlow) => {
    if (cashFlow.id === item.id) {
      return { ...cashFlow, isPending: true };
    }
    return cashFlow;
  });

  switch (type) {
    case dictionary.DATA_LIST_TYPE_INCOMES:
      dispatchedObject = {
        ...dispatchedObject,
        currentIncomes: newCashFlowsList,
      };
      break;
    case dictionary.DATA_LIST_TYPE_COSTS:
      dispatchedObject = {
        ...dispatchedObject,
        currentCosts: newCashFlowsList,
      };
      break;
    case dictionary.DATA_LIST_TYPE_SPENDINGS:
      dispatchedObject = {
        ...dispatchedObject,
        currentSpendings: newCashFlowsList,
      };
      break;
    default:
      break;
  }

  dispatch(dispatchedFunction(dispatchedObject));

  if (!item.isNew) {
    try {
      fetchData(requestURL, 'DELETE')
        .then(() => {
          newCashFlowsList = currentCashFlows.filter((cashFlow) => cashFlow.id !== item.id);

          switch (type) {
            case dictionary.DATA_LIST_TYPE_INCOMES:
              dispatchedObject = {
                currentIncomes: newCashFlowsList,
                currentIncomesSum: getSumByArray(newCashFlowsList),
              };
              break;
            case dictionary.DATA_LIST_TYPE_COSTS:
              dispatchedObject = {
                currentCosts: newCashFlowsList,
                currentCostsSum: getSumByArray(newCashFlowsList),
              };
              break;
            case dictionary.DATA_LIST_TYPE_SPENDINGS:
              dispatchedObject = {
                currentSpendings: newCashFlowsList,
                currentSpendingsSum: getSumByArray(newCashFlowsList),
              };
              break;
            default:
              break;
          }

          dispatch(dispatchedFunction(dispatchedObject));
          sendAmplitudeEvent('cashflow edited', {
            type,
            action: 'Deleting',
          });
        })
        .catch(() => {
          toast.error('Не удалось удалить Cashflow-объект.');
        });
    } catch (err) {
      dispatch(setIsFetchFailed(true));
    }
  } else {
    newCashFlowsList = currentCashFlows.filter((cashFlow) => cashFlow.id !== item.id);

    switch (type) {
      case dictionary.DATA_LIST_TYPE_INCOMES:
        dispatchedObject = {
          currentIncomes: newCashFlowsList,
          currentIncomesSum: getSumByArray(newCashFlowsList),
        };
        break;
      case dictionary.DATA_LIST_TYPE_COSTS:
        dispatchedObject = {
          currentCosts: newCashFlowsList,
          currentCostsSum: getSumByArray(newCashFlowsList),
        };
        break;
      case dictionary.DATA_LIST_TYPE_SPENDINGS:
        dispatchedObject = {
          currentSpendings: newCashFlowsList,
          currentSpendingsSum: getSumByArray(newCashFlowsList),
        };
        break;
      default:
        break;
    }

    dispatch(dispatchedFunction(dispatchedObject));
  }
};

export const editCashFlow = (item, type) => async (dispatch, getState) => {
  let currentCashFlows = [];
  let dispatchedFunction = null;
  let dispatchedObject = {};
  let addRequestURL = '';
  let editRequestURL = '';

  const {
    currentIncomes, currentCosts, currentSpendings, date,
  } = getState();

  switch (type) {
    case dictionary.DATA_LIST_TYPE_INCOMES:
      currentCashFlows = currentIncomes;
      dispatchedFunction = setIncomes;
      dispatchedObject = {
        currentIncomes: [],
        currentIncomesSum: null,
      };
      addRequestURL = process.env.INCOMES_URL;
      editRequestURL = `${addRequestURL}${item.id}/`;
      break;
    case dictionary.DATA_LIST_TYPE_COSTS:
      currentCashFlows = currentCosts;
      dispatchedFunction = setCosts;
      dispatchedObject = {
        currentCosts: [],
        currentCostsSum: null,
      };
      addRequestURL = process.env.COSTS_URL;
      editRequestURL = `${addRequestURL}${item.id}/`;
      break;
    case dictionary.DATA_LIST_TYPE_SPENDINGS:
      currentCashFlows = currentSpendings;
      dispatchedFunction = setSpendings;
      dispatchedObject = {
        currentSpendings: [],
        currentSpendingsSum: null,
      };
      addRequestURL = process.env.SPENDINGS_URL;
      editRequestURL = `${addRequestURL}${item.id}/`;
      break;
    default:
      toast.error('Не выбран тип CashFlow-объекта.');
      return false;
  }

  let newCashFlowsList = currentCashFlows.map((cashFlow) => {
    if (cashFlow.id === item.id) {
      return { ...cashFlow, isPending: true };
    }
    return cashFlow;
  });

  switch (type) {
    case dictionary.DATA_LIST_TYPE_INCOMES:
      dispatchedObject = {
        ...dispatchedObject,
        currentIncomes: newCashFlowsList,
      };
      break;
    case dictionary.DATA_LIST_TYPE_COSTS:
      dispatchedObject = {
        ...dispatchedObject,
        currentCosts: newCashFlowsList,
      };
      break;
    case dictionary.DATA_LIST_TYPE_SPENDINGS:
      dispatchedObject = {
        ...dispatchedObject,
        currentSpendings: newCashFlowsList,
      };
      break;
    default:
      break;
  }

  dispatch(dispatchedFunction(dispatchedObject));

  try {
    const payload = {
      date: type === dictionary.DATA_LIST_TYPE_SPENDINGS
        ? getBeginOfDay(date) / 1000
        : getBeginOfMonth(date) / 1000,
      category: item.category,
      value: item.value,
    };
    const updatedCashFlow = item.isNew
      ? await fetchData(addRequestURL, 'POST', payload)
      : await fetchData(editRequestURL, 'PUT', payload);

    newCashFlowsList = currentCashFlows.map((cashFlow) => {
      if (cashFlow.id === item.id) {
        return {
          id: updatedCashFlow.id, category: updatedCashFlow.category, value: updatedCashFlow.value,
        };
      }
      return cashFlow;
    });

    switch (type) {
      case dictionary.DATA_LIST_TYPE_INCOMES:
        dispatchedObject = {
          currentIncomes: newCashFlowsList,
          currentIncomesSum: getSumByArray(newCashFlowsList),
        };
        break;
      case dictionary.DATA_LIST_TYPE_COSTS:
        dispatchedObject = {
          currentCosts: newCashFlowsList,
          currentCostsSum: getSumByArray(newCashFlowsList),
        };
        break;
      case dictionary.DATA_LIST_TYPE_SPENDINGS:
        dispatchedObject = {
          currentSpendings: newCashFlowsList,
          currentSpendingsSum: getSumByArray(newCashFlowsList),
        };
        break;
      default:
        break;
    }

    dispatch(dispatchedFunction(dispatchedObject));
    sendAmplitudeEvent('cashflow edited', {
      type,
      action: item.isNew ? 'Adding' : 'Updating',
    });
  } catch (err) {
    toast.error('Не удалось изменить постоянные расходы.');
    dispatch(setIsFetchFailed(true));

    switch (type) {
      case dictionary.DATA_LIST_TYPE_INCOMES:
        dispatchedObject = {
          currentIncomes: currentCashFlows,
          currentIncomesSum: getSumByArray(currentCashFlows),
        };
        break;
      case dictionary.DATA_LIST_TYPE_COSTS:
        dispatchedObject = {
          currentCosts: currentCashFlows,
          currentCostsSum: getSumByArray(currentCashFlows),
        };
        break;
      case dictionary.DATA_LIST_TYPE_SPENDINGS:
        dispatchedObject = {
          currentSpendings: currentCashFlows,
          currentSpendingsSum: getSumByArray(currentCashFlows),
        };
        break;
      default:
        break;
    }

    dispatch(dispatchedFunction(dispatchedObject));
  }
};

/* Savings */

export const editSavings = (data) => async (dispatch, getState) => {
  const {
    currentSavings, currentYearSavings, currentIncomesSum,
  } = getState();
  const initialCurrentSavings = currentSavings;
  const initialCurrentYearSavings = currentYearSavings;

  try {
    const newCurrentSavings = await fetchData(process.env.SAVINGS_URL, 'PUT', data);
    const newCurrentYearSavings = currentYearSavings.map((item) => {
      if (item.date === newCurrentSavings.date) {
        return {
          date: newCurrentSavings.date,
          type: newCurrentSavings.type,
          value: newCurrentSavings.type === 0
            ? newCurrentSavings.value
            : Math.round((newCurrentSavings.value * currentIncomesSum) / 100),
          percent: newCurrentSavings.type === 1
            ? newCurrentSavings.value
            : Math.round((newCurrentSavings.value / currentIncomesSum) * 100),
        };
      }
      return item;
    });
    dispatch(setSavings({
      currentSavings: newCurrentSavings,
      currentYearSavings: newCurrentYearSavings,
    }));

    sendAmplitudeEvent('cashflow edited', {
      type: 'SAVINGS',
      action: 'Updating',
    });
  } catch (err) {
    toast.error('Не удалось изменить сбережения.');
    dispatch(setIsFetchFailed(true));
    dispatch(setSavings({
      currentSavings: initialCurrentSavings,
      currentYearSavings: initialCurrentYearSavings,
    }));
  }
};

/* Overview */

export const getOverviewData = () => async (dispatch) => {
  await dispatch(fetchSpendings());
  await dispatch(fetchIncomes());
  await dispatch(fetchCosts());
  await dispatch(fetchSavings());
  dispatch(calculateOverviewData());
  await dispatch(fetchSaldo());
};
