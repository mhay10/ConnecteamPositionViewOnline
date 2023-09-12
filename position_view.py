import matplotlib.pyplot as plt
from datetime import datetime as dt
import pandas as pd
import numpy as np
import sys
import re

# Create color for each position
def get_lexographic_value(s: str):
    s = s.lower()

    total = 0
    for i, c in enumerate(s):
        value = ord(c) - ord("A") + 1
        total += value * (26 ** (len(s) - i - 1))

    return total

# RGB Value generator
def get_color(val: int):
    val_range = (0, np.iinfo(np.uint8).max)
    rgb_range = (0, 255)

    r = int(np.interp(val % 256, val_range, rgb_range))
    g = int(np.interp((val // 256) % 256, val_range, rgb_range))
    b = int(np.interp((val // (256**2)) % 256, val_range, rgb_range))

    return (r / 255, g / 255, b / 255)



def main(argv):
    # Verify input file was defined
    if len(sys.argv) != 2:
        print("Usage: python position_view.py <file>")
        sys.exit(1)

    # Read the shifts from the CSV file into a DataFrame
    shiftData = pd.read_csv(
        sys.argv[1],
        header=None,
        names=["Position", "Name", "Start", "End"],
    )

    # Create dictionary for all position colors
    position_colors = {
        pos: get_color(get_lexographic_value(pos)) for pos in shiftData.Position.values
    }

    # Create a figure and an axis object
    fig, ax = plt.subplots(figsize=(15, 8))

    # Set grid formatting
    # X axis formatting
    ax.grid(which="major", axis="x", linestyle="solid", alpha=0.25, color="gainsboro")
    ax.grid(which="minor", axis="x", linestyle=":", linewidth=0.5, alpha=0.5, color="gainsboro")
    ax.tick_params(axis="x")

    # Y axis formatting
    ax.grid(which="major", axis="y", linestyle="--", alpha=0.25, color="gainsboro")

    # Loop through the rows of the shifts and plot a horizontal bar for each row
    for i, row in shiftData.iterrows():
        shifts = shiftData[shiftData.Position == row.Position]
        start = dt.strptime(row["Start"], "%a %b %d %Y %H:%M:%S GMT%z (%Z)")
        end = dt.strptime(row["End"], "%a %b %d %Y %H:%M:%S GMT%z (%Z)")
        duration = end - start

        bar = ax.broken_barh(
            [(start.hour + start.minute / 60, duration.total_seconds() / 3600)],
            (i - 0.25, 0.5),
            facecolors=position_colors[row.Position] + (0.25,),
            edgecolors=position_colors[row.Position] + (0.5,),
        )

        
        # Name and time text
        # Start time options to prevent text crash with edge of plot
        if start.hour + start.minute / 60 < 8.5: 
            ax.text(
                start.hour + start.minute / 60, # start time
                i+0.075,
                dt.strftime(start, "%I:%M %p"),
                fontsize=8,
                weight="bold",
                ha="left",
                va="center",
                color="black",
            )
        else:
            ax.text(
                start.hour + start.minute / 60, # start time
                i+0.075,
                dt.strftime(start, "%I:%M %p"),
                fontsize=8,
                weight="bold",
                ha="right",
                va="center",
                color="black",
            )
        ax.text(
            start.hour + start.minute / 60 + duration.total_seconds() / 7200,
            i + 0.075,
            str(row["Name"]),
            fontsize=8,
            weight="bold",
            ha="center",
            va="center",
            color="black",
        )

        # End time options to prevent crashing with edge of plot
        if end.hour + end.minute / 60 > 21.5:
            ax.text(
                end.hour + end.minute / 60, # end time
                i+0.075,
                dt.strftime(end, "%I:%M %p"),
                fontsize=8,
                weight="bold",
                ha="right",
                va="center",
                color="black",
            )
        else:    
            ax.text(
                end.hour + end.minute / 60, # end time
                i+0.075,
                dt.strftime(end, "%I:%M %p"),
                fontsize=8,
                weight="bold",
                ha="left",
                va="center",
                color="black",
            )

    # Set the y-ticks and labels to the positions
    ax.set_yticks(range(len(shiftData)))
    ax.set_yticklabels(shiftData["Position"])

    # Set the major x-ticks every 30 mins
    xticks = np.arange(7.5, 22.5, 0.5)
    ax.set_xticks(xticks)
    xlabels = [
        f"{int(t) % 12 if int(t) != 12 else 12}:{'00' if t.is_integer() else '30'} {'AM' if t < 12 else 'PM'}"
        for t in xticks
    ]
    ax.set_xticklabels(xlabels)
    ax.set_xlim(xticks[0], xticks[-1])
    plt.xticks(rotation=45)

    # Set the minor x-ticks every 15 mins
    minor_xticks = np.arange(7.75, 22.5, 0.5)
    ax.set_xticks(minor_xticks, minor=True)

    # Set the title and axis labels
    titleName = re.search(r'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday', argv[1])[0]
    ax.set_title("Position View - " + titleName)

    # Invert y-axis
    ax.invert_yaxis()

    # Show the plot
    plt.show()



if __name__ == "__main__":
    main(sys.argv)