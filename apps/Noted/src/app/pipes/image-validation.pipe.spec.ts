import { ApiException } from "@noted/common/errors/api-exception";
import { ImageValidationPipe } from "./image-validation.pipe";
import { HttpStatus } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from "multer";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

describe("ImageValidationPipe", () => {
  let pipe: ImageValidationPipe;

  beforeEach(() => {
    pipe = new ImageValidationPipe();
  });

  it("should throw error if file is undefined", () => {
    expect(() => pipe.transform(undefined)).toThrow(ApiException);
  });

  it("should throw error if file is null", () => {
    expect(() => pipe.transform(null)).toThrow(ApiException);
  });

  it("should throw error if file is not allowed mimetype", () => {
    const mockFile = {
      buffer: Buffer.from("test"),
      originalname: "test.png",
      mimetype: "exe",
      size: 1024,
    } as Express.Multer.File;

    expect(() => pipe.transform(mockFile)).toThrow(ApiException);

    try {
      pipe.transform(mockFile);
      fail("Expected to throw ApiException");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiException);
      expect(error.errorCode).toBe(ErrorCodes.INVALID_FILE_TYPE);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
