// La edad como la muestran las listas y fichas de personas: "1 año", "17 años".
export const formatAge = (age: number) => (age === 1 ? '1 año' : `${age} años`);
