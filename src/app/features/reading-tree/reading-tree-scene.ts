/** Lugares de la copa donde cuelgan hojas: x, y y una leve inclinación. */
const LEAF_SPOTS: readonly [number, number, number][] = [
  [98, 262, 12],
  [146, 288, 4],
  [196, 296, -3],
  [246, 294, 6],
  [294, 282, -6],
  [338, 258, -12],
  [72, 206, 18],
  [362, 200, -18],
  [222, 304, 0],
];

/** Lo que tarda la hoja en caer; coincide con `leaf-fall` en el SCSS. */
const FALL_MS = 1100;

/** Círculos (cx, cy, r) que forman la copa, al estilo de un árbol de caricatura. */
export const TREE = {
  crown: [
    [110, 190, 55],
    [150, 130, 60],
    [210, 100, 62],
    [275, 128, 60],
    [322, 185, 55],
    [302, 242, 50],
    [242, 252, 55],
    [172, 252, 55],
    [116, 242, 45],
    [80, 214, 40],
    [348, 224, 40],
    [210, 172, 82],
    [172, 82, 45],
    [252, 80, 45],
  ],
  shade: [
    [162, 262, 36],
    [252, 264, 36],
    [322, 244, 28],
    [100, 238, 26],
    [212, 236, 40],
  ],
  light: [
    [150, 112, 34],
    [212, 82, 38],
    [272, 108, 32],
    [112, 176, 28],
    [204, 160, 40],
    [300, 172, 26],
  ],
};

/** Una hoja por libro pendiente, hasta llenar los lugares de la copa. */
export function leavesFor(
  pendingBooks: number,
): { index: number; x: number; y: number; tilt: number }[] {
  return LEAF_SPOTS.slice(0, Math.min(pendingBooks, LEAF_SPOTS.length)).map(
    ([x, y, tilt], index) => ({ index, x, y, tilt }),
  );
}

/** Se cumple cuando la hoja terminó de caer; sin animaciones, enseguida. */
export function whenLeafFalls(): Promise<void> {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : FALL_MS));
}
