import shuffleArray, {rngBuilder} from '../shuffleArray';

describe(rngBuilder, () => {
  // Breaking these orders would be a breaking change
  // Some people will be using seeds relying on a particular order
  test.each([1, 2, 4, 8, 16])('creates a randomiser given seed %s', seed => {
    const rng = rngBuilder(seed);
    const results = Array(10)
      .fill(0)
      .map(() => rng.next());
    expect(results).toMatchSnapshot();
  });
});

describe(shuffleArray, () => {
  it('empty array is shuffled', () => {
    const shuffled = shuffleArray([]);
    expect(shuffled).toEqual([]);
  });

  // Breaking these orders would be a breaking change
  // Some people will be using seeds relying on a particular order
  const seed = 123;
  test.each([[['a']], [['a', 'b']], [['a', 'b', 'c']], [['a', 'b', 'c', 'd']]])(
    'shuffles list %p',
    l => {
      const rng = rngBuilder(seed);
      expect(shuffleArray(l, () => rng.next())).toMatchSnapshot();
    },
  );
});
