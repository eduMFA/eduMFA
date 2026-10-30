"""
Largest-Triangle-Three-Buckets (LTTB) downsampling, pure Python.

Steinarsson, S. (2013): "Downsampling Time Series for Visual Representation".
"""


def lttb(points, threshold, x_key=None):
    """
    Downsample ``points`` to ``threshold`` points while preserving the visual shape.

    :param points: sequence of (x, y) tuples, sorted ascending by x
    :param threshold: target number of points (>= 3); if len(points) <= threshold
        the input is returned unchanged
    :param x_key: optional callable mapping x to a float (e.g. datetime.timestamp)
    :return: list of (x, y) tuples taken from ``points`` (original objects)
    """
    n = len(points)
    if threshold >= n or threshold < 3:
        return list(points)

    fx = x_key or (lambda x: x)
    xs = [float(fx(p[0])) for p in points]
    ys = [float(p[1]) for p in points]

    sampled = [points[0]]
    every = (n - 2) / (threshold - 2)
    a = 0  # index of the previously selected point

    for i in range(threshold - 2):
        # bucket after the current one -> its average is the third triangle corner
        next_start = int((i + 1) * every) + 1
        next_end = min(int((i + 2) * every) + 1, n)
        span = next_end - next_start
        avg_x = sum(xs[next_start:next_end]) / span
        avg_y = sum(ys[next_start:next_end]) / span

        # current bucket -> pick the point with the largest triangle area
        start = int(i * every) + 1
        end = int((i + 1) * every) + 1
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

