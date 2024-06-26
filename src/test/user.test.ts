import { Express } from "express";
import chai from "chai";
import chaiHttp from "chai-http";
import { expect } from "chai";
import assert from "assert";

describe("Array", function () {
    describe("#indexOf()", function () {
        it("should return -1 when the value is not present", function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});
