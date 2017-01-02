import React, { PropTypes } from 'react';
import style from './style.css';

function ColorItem({ className, shade }) {
  return <li className={style[className]}>
    <span className={style.shade}>{shade}</span>
  </li>;
}

ColorItem.PropTypes = {
  className: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  shade: PropTypes.string.isRequired,
};

const colors = [
  {shade: 50, className: "color50"},
  {shade: 100, className: "color100"},
  {shade: 200, className: "color200"},
  {shade: 300, className: "color300"},
  {shade: 400, className: "color400"},
  {shade: 500, className: "color500"},
  {shade: 600, className: "color600"},
  {shade: 700, className: "color700"},
  {shade: 800, className: "color800"},
  {shade: 900, className: "color900"},
];

export default function ColorGroup() {
  return (
    <ul className={style.colorGroup}>
      {colors.map(color => <ColorItem key={color.shade} className={color.className} shade={color.shade} />)}
    </ul>
  );
}
