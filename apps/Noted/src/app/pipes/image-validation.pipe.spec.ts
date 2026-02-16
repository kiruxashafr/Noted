import { ImageValidationPipe } from "./image-validation.pipe";
import { HttpStatus } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from "multer";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import { InvalidFileTypeException, MissingFileException } from "@noted/common/errors/domain_exception/domain-exception";

describe("ImageValidationPipe", () => {
  let pipe: ImageValidationPipe;

  beforeEach(() => {
    pipe = new ImageValidationPipe();
  });

  it("should throw error if file is undefined", () => {
    expect(() => pipe.transform(undefined)).toThrow(MissingFileException);
  });

  it("should throw error if file is null", () => {
    expect(() => pipe.transform(null)).toThrow(MissingFileException);
  });

  it("should throw error if file is not allowed mimetype", () => {
    const mockFile = {
      buffer: Buffer.from("test"),
      originalname: "test.png",
      mimetype: "exe",
      size: 1024,
    } as Express.Multer.File;

    expect(() => pipe.transform(mockFile)).toThrow(InvalidFileTypeException);
  });
});
