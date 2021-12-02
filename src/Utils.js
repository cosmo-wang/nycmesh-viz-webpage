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

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

export function distanceInKmBetweenCoordinates(lat1, lon1, lat2, lon2) {
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2-lat1);
  var dLon = degreesToRadians(lon2-lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return earthRadiusKm * c;
}
