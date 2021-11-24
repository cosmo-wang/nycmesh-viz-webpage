export const ip_to_nn = (ip) => {
  ip = ip.toString();
  const splitted = ip.split('.');
  let three = splitted[0];
  let four = splitted[1];
  if (four.length === 3) {
    four = four.substring(1);
  }
  if (four.length === 1) {
    four = '0' + four;
  }
  return three + four;
}

export const nn_to_ip = (id) => {
  id = id.toString();
  if (id.length === 4) {
    return `${parseInt(id.substring(0,2))}.${parseInt(id.substring(2))}`;
  } else if (id.length === 3) {
    return `${id.substring(0,1)}.${id.substring(1)}`;
  } else if (id.length === 2 || id.length === 1) {
    return `0.${id}`
  }
}
