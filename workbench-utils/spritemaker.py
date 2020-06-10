from pathlib import Path
from PIL import Image
import numpy as np
import sys

# print(Path(__file__).parent.absolute())
# Constants
TRAINING_PATH = Path(__file__).parent.absolute()
SPRITE_SIZE = 60

# Initialization
x_data = []
y_data = []
final_image = np.array([])
y_offset = 0
imageCount = 0
for image_file in Path(TRAINING_PATH).glob("**/*.jpg"):
    imageCount += 1
print(imageCount)
new_im = Image.new('RGB', (SPRITE_SIZE*SPRITE_SIZE, imageCount))

labels = [0]*(len(sys.argv)-1);
# print(len(sys.argv))

# Load the training sprite by looping over every image file
for image_file in Path(TRAINING_PATH).glob("**/*.jpg"):

    # Load the current image file
    src_image = Image.open(image_file)
    # make it smaller
    downsized = src_image.resize((SPRITE_SIZE, SPRITE_SIZE))

    # get 1px high version
    pixels = list(downsized.getdata())
    smoosh = Image.new('RGB', (SPRITE_SIZE * SPRITE_SIZE, 1))
    smoosh.putdata(pixels)

    # store image
    x_data.append(smoosh)
    folderName = str(image_file.parent.absolute(
    ))[-(len(str(image_file.parent.absolute()))-str(image_file.parent.absolute()).rindex('/')-1):]
    # print(folderName)
    # for i in image_file.stem:
    #     print(i)
    # print(sys.argv[2])
    # Use image path to build our answer key
    for i in range(1, len(sys.argv)):
        if folderName == sys.argv[i]:
            y_data.append(i)
            labels[i-1] += 1


print(labels)

#  randomize X and Y the same way before making data

assert len(y_data) == len(x_data)
p = np.random.permutation(len(y_data))
npy = np.array(y_data)
shuffled_y = npy[p].tolist()

one_hot_y = []
# Build the data image and 1-hot encoded answer array
for idx in p:
    # build master sprite 1 pixel down at a time
    new_im.paste(x_data[idx], (0, y_offset))

    for i in range(1, len(sys.argv)):
        if shuffled_y[y_offset] == i:
            for j in range(1, len(sys.argv)):
                if j==i:
                    one_hot_y.append(1)
                else:
                    one_hot_y.append(0)
    # build 1-hot encoded answer key

    y_offset += 1


# Save answers file (Y)
newFile = open("./workbench-utils/dataset/labels.bin", "wb")
newFileByteArray = bytearray(one_hot_y)
bytesWritte = newFile.write(newFileByteArray)
# should be num classes * original answer key size
assert bytesWritte == ((len(sys.argv)-1) * len(y_data))

# Save Data Sprite (X)
# new_im = new_im.convert("RGBA")

pixdata = new_im.load()

# Clean the background noise, if color != white, then set to black.
# change with your color

# for y in range(new_im.size[1]):
#     for x in range(new_im.size[0]):
#         if pixdata[x, y][0] == 255:
#             pixdata[x, y] = (255, 255, 255)

new_im.save('./workbench-utils/dataset/data.jpg')


