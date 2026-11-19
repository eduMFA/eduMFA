"""
Largest-Triangle-Three-Buckets (LTTB) downsampling, pure Python.

Steinarsson, S. (2013): "Downsampling Time Series for Visual Representation".
"""

from collections.abc import Callable, Sequence
from typing import SupportsFloat, TypeVar, cast

X = TypeVar("X")
Y = TypeVar("Y", bound=SupportsFloat)


def lttb(
    points: Sequence[tuple[X, Y]],
    threshold: int,
    x_key: Callable[[X], SupportsFloat] | None = None,
) -> list[tuple[X, Y]]:
    """
    Downsample ``points`` to ``threshold`` points while preserving the visual shape.

    :param points: sequence of (x, y) tuples, sorted ascending by x
    :param threshold: target number of points (>= 3); if len(points) <= threshold
        the input is returned unchanged
    :param x_key: optional callable mapping x to a float (e.g. datetime.timestamp)
    :return: list of (x, y) tuples taken from ``points`` (original objects)
    """
    if threshold < 3:
        raise ValueError("threshold must be at least 3")

    n = len(points)
    if threshold >= n:
        return list(points)

    if x_key is None:
        xs = [float(cast(SupportsFloat, point[0])) for point in points]
    else:
        xs = [float(x_key(point[0])) for point in points]
    ys = [float(p[1]) for p in points]

    sampled = [points[0]]
    interior_points = n - 2
    bucket_count = threshold - 2
    a = 0  # index of the previously selected point

    for i in range(bucket_count):
        start = i * interior_points // bucket_count + 1
        end = (i + 1) * interior_points // bucket_count + 1

        # bucket after the current one -> its average is the third triangle corner
        next_end = min((i + 2) * interior_points // bucket_count + 1, n)
        span = next_end - end
        avg_x = sum(xs[end:next_end]) / span
        avg_y = sum(ys[end:next_end]) / span

        # current bucket -> pick the point with the largest triangle area
        ax, ay = xs[a], ys[a]
        max_area = -1.0
        max_idx = start
        for j in range(start, end):
            area = abs((ax - avg_x) * (ys[j] - ay) - (ax - xs[j]) * (avg_y - ay))
            if area > max_area:
                max_area = area
                max_idx = j

        sampled.append(points[max_idx])
        a = max_idx

    sampled.append(points[-1])
    return sampled
