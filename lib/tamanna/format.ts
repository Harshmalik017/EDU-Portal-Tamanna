const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const istFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export const formatDate = (value: string | number | Date) => dateFormatter.format(new Date(value));
export const formatDateTimeIst = (value: string | number | Date) => `${istFormatter.format(new Date(value))} IST`;
