const getWeekDay = (value, options = { weekday: "long" }) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", options).format(date);
};

export { getWeekDay };
