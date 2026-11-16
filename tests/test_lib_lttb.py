import datetime
import unittest

from edumfa.lib.lttb import lttb


class LTTBTestCase(unittest.TestCase):
    def test_threshold_must_be_at_least_three(self) -> None:
        with self.assertRaisesRegex(ValueError, "at least 3"):
            lttb([(0, 1), (1, 2), (2, 3)], 2)

    def test_short_inputs_are_returned_unchanged(self) -> None:
        for points in ([], [(0, 1)], [(0, 1), (1, 2)]):
            self.assertEqual(points, lttb(points, 3))

    def test_downsampling_respects_threshold_and_endpoints(self) -> None:
        points = [(index, index % 3) for index in range(20)]

        sampled = lttb(points, 5)

        self.assertEqual(5, len(sampled))
        self.assertEqual(points[0], sampled[0])
        self.assertEqual(points[-1], sampled[-1])

    def test_downsampling_preserves_peak(self) -> None:
        points = [(0, 0), (1, 0), (2, 10), (3, 0), (4, 0)]

        sampled = lttb(points, 3)

        self.assertIn((2, 10), sampled)

    def test_custom_x_key(self) -> None:
        start = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
        points = [
            (start + datetime.timedelta(minutes=index), index % 2)
            for index in range(10)
        ]

        sampled = lttb(points, 4, x_key=lambda value: value.timestamp())

        self.assertEqual(4, len(sampled))
        self.assertEqual(points[0], sampled[0])
        self.assertEqual(points[-1], sampled[-1])
