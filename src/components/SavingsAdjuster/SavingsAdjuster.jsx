import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import moment from 'moment';
import isNil from 'lodash/isNil';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

import dictionary from '../../utils/dictionary';
import { updateSavingsData } from '../../store/action-creator';
import styles from './SavingsAdjuster.module.scss';

const SavingsAdjuster = (props) => {
  const dispatch = useDispatch();

  const {
    date,
    incomesCurrentMonthSum,
    savingsCurrentMonthSum,
  } = props;

  const {
    savingsAdjuster,
    savingsAdjusterHeader,
    savingsAdjusterHeaderTitle,
    savingsAdjusterHeaderDate,
    savingsAdjusterBody,
    savingsAdjusterRange,
    savingsAdjusterInputsWrapper,
    savingsAdjusterInputsLabel,
    savingsAdjusterInput,
    savingsAdjusterInputPercentage,
    savingsAdjusterTextDivider,
    savingsAdjusterCalculationsWrapper,
    savingsAdjusterCalculation,
    savingsAdjusterRangeFiller,
  } = styles;

  const [newSavingsValue, setNewSavingsValue] = useState(null);
  const [newSavingsPercent, setNewSavingsPercent] = useState(null);
  const [isNewSavingsValueChanged, setIsNewSavingsValueChanged] = useState(false);

  const rangeInput = useRef(null);
  const newSavingsPercentInput = useRef(null);
  const newSavingsValueInput = useRef(null);

  const onSavingsChange = (type, value) => {
    let newPercent = null;
    let newValue = null;

    if (type === dictionary.SAVINGS_INPUT_TYPE_PERCENTS) {
      newPercent = value > 100 ? 100 : value;
      newValue = ((incomesCurrentMonthSum * newPercent) / 100);
    } else if (type === dictionary.SAVINGS_INPUT_TYPE_VALUE) {
      newValue = value > incomesCurrentMonthSum ? incomesCurrentMonthSum : value;
      newPercent = Math.round((newValue / incomesCurrentMonthSum) * 100);
    }

    if (newValue !== newSavingsValue || newValue !== newSavingsPercent) {
      setNewSavingsPercent(newPercent);
      setNewSavingsValue(newValue);
      rangeInput.current.value = newPercent;
      newSavingsPercentInput.current.value = newPercent;
      newSavingsValueInput.current.value = newValue;
      setIsNewSavingsValueChanged(true);
    }
  };

  useEffect(() => {
    if (isNewSavingsValueChanged) {
      dispatch(updateSavingsData(newSavingsValue));
      setIsNewSavingsValueChanged(false);
    }
  }, [isNewSavingsValueChanged]);

  useEffect(() => {
    if (!isNil(savingsCurrentMonthSum) && !isNil(incomesCurrentMonthSum)) {
      setNewSavingsValue(savingsCurrentMonthSum);
      setNewSavingsPercent(Math.round((savingsCurrentMonthSum / incomesCurrentMonthSum) * 100));
    }
  }, [savingsCurrentMonthSum, incomesCurrentMonthSum]);

  return (
    <div className={['panel', savingsAdjuster, 'mb-3'].join(' ')}>
      <div className={['panel-header', savingsAdjusterHeader].join(' ')}>
        <div className={['panel-header-title', savingsAdjusterHeaderTitle].join(' ')}>
          Размер сбережений
        </div>
        <div className={['panel-header-subtitle', savingsAdjusterHeaderDate].join(' ')}>
          <SkeletonTheme color="#252A48" highlightColor="#222743">
            { date
              ? moment(date).format('MMMM YYYY')
              : (
                <Skeleton width={50} height={20} />
              )
            }
          </SkeletonTheme>
        </div>
      </div>
      <div className={['panel-body', savingsAdjusterBody].join(' ')}>
        <SkeletonTheme color="#252A48" highlightColor="#222743">
          { (!isNil(newSavingsValue) && !isNil(newSavingsPercent))
            ? (
              <div className={savingsAdjusterRange}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  ref={rangeInput}
                  defaultValue={newSavingsPercent}
                  onChange={() => onSavingsChange(
                    dictionary.SAVINGS_INPUT_TYPE_PERCENTS, rangeInput.current.value,
                  )}
                />
                <div className={savingsAdjusterRangeFiller} style={{ width: `${newSavingsPercent}%` }} />
              </div>
            ) : (
              <Skeleton />
            )
          }
        </SkeletonTheme>
        <SkeletonTheme color="#252A48" highlightColor="#222743">
          { (!isNil(newSavingsValue) && !isNil(newSavingsPercent))
            ? (
              <div>
                <div className={savingsAdjusterInputsWrapper}>
                  <div className={[savingsAdjusterInput, savingsAdjusterInputPercentage].join(' ')}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="30"
                      ref={newSavingsPercentInput}
                      defaultValue={newSavingsPercent}
                      onChange={() => onSavingsChange(
                        dictionary.SAVINGS_INPUT_TYPE_PERCENTS, newSavingsPercentInput.current.value,
                      )}
                    />
                  </div>
                  <div className={savingsAdjusterTextDivider}>
                    или
                  </div>
                  <div className={savingsAdjusterInput}>
                    <input
                      type="number"
                      min="0"
                      placeholder="15000"
                      ref={newSavingsValueInput}
                      defaultValue={newSavingsValue}
                      onChange={() => onSavingsChange(
                        dictionary.SAVINGS_INPUT_TYPE_VALUE, newSavingsValueInput.current.value,
                      )}
                    />
                  </div>
                </div>
                <div className={[savingsAdjusterInputsLabel, 'mt-2'].join(' ')}>
                  От дохода
                  <span>{` ${incomesCurrentMonthSum} `}</span>
                  в месяц
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <Skeleton height={45} />
              </div>
            )
          }
        </SkeletonTheme>
      </div>
      <div className="panel-footer">
        <div className={savingsAdjusterCalculationsWrapper}>
          <div className={[savingsAdjusterCalculation, 'mb-3'].join(' ')}>
            <SkeletonTheme color="#252A48" highlightColor="#222743">
              { (!isNil(newSavingsValue) && !isNil(newSavingsPercent))
                ? `= ${newSavingsValue} в месяц`
                : (
                  <Skeleton />
                )
              }
            </SkeletonTheme>
          </div>
          <div className={savingsAdjusterCalculation}>
            <SkeletonTheme color="#252A48" highlightColor="#222743">
              { (!isNil(newSavingsValue) && !isNil(newSavingsPercent))
                ? `= ${newSavingsValue * 12} в год`
                : (
                  <Skeleton />
                )
              }
            </SkeletonTheme>
          </div>
        </div>
      </div>
    </div>
  );
};

SavingsAdjuster.propTypes = {
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  incomesCurrentMonthSum: PropTypes.number.isRequired,
  savingsCurrentMonthSum: PropTypes.number.isRequired,
};

export default SavingsAdjuster;