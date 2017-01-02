import React, { PropTypes } from 'react';
import style from './style.css';

export default function Headers() {
  return (
    <div className={style.Headers}>
      <h1>First level header</h1>
      <h2>Second level header</h2>
      <h3>Thirt level header</h3>
      <h4>Fourth level header</h4>
      <h5>Fifth level header</h5>
    </div>
  );
}
